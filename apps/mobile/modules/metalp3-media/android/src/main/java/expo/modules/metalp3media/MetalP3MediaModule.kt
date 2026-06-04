package expo.modules.metalp3media

import android.Manifest
import android.app.Activity
import android.content.ContentUris
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.database.Cursor
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.util.Base64
import androidx.core.content.ContextCompat
import androidx.core.database.getStringOrNull
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MetalP3MediaModule : Module() {

  private data class PendingDelete(
    val uris: List<String>,
    val promise: Promise,
    val absoluteFolderPaths: Set<String> = emptySet(),
  )

  private val pendingDeletes = mutableMapOf<Int, PendingDelete>()
  private var nextDeleteRequestCode = 0x4D44 // 'MD'

  private val mainHandler = Handler(Looper.getMainLooper())
  private var mediaObserver: ContentObserver? = null

  // ContentObserver fires repeatedly during a multi-file copy; debounce so we
  // emit one event per logical batch instead of N per second.
  private val mediaChangedDebounce = Runnable {
    sendEvent("mediaChanged", emptyMap<String, Any?>())
  }

  override fun definition() = ModuleDefinition {
    Name("MetalP3Media")
    Events("mediaChanged")

    Constants(
      "audioPermission" to audioPermissionName(),
    )

    OnCreate { registerMediaObserver() }
    OnDestroy { unregisterMediaObserver() }

    AsyncFunction("getPermissionsAsync") {
      mapOf(
        "granted" to hasAudioPermission(),
        "permission" to audioPermissionName(),
      )
    }

    AsyncFunction("scanAudioAsync") { options: Map<String, Any?>? ->
      requirePermission()
      scan(options ?: emptyMap())
    }

    AsyncFunction("searchAsync") { query: String, limit: Int? ->
      requirePermission()
      search(query, limit ?: 200)
    }

    AsyncFunction("getTrackAsync") { uri: String ->
      requirePermission()
      readTrackTags(uri)
    }

    AsyncFunction("getArtworkAsync") { uri: String ->
      requirePermission()
      readArtwork(uri)
    }

    AsyncFunction("getLyricsAsync") { uri: String ->
      requirePermission()
      readLyrics(uri)
    }

    AsyncFunction("getSyncedLyricsAsync") { uri: String ->
      requirePermission()
      readSyncedLyrics(uri)
    }

    AsyncFunction("getExtrasAsync") { uri: String ->
      requirePermission()
      readExtras(uri)
    }

    AsyncFunction("deleteTracksAsync") { uris: List<String>, promise: Promise ->
      deleteTracks(uris, promise)
    }

    AsyncFunction("deleteAlbumFolderAsync") { audioUris: List<String>, promise: Promise ->
      deleteAlbumFolder(audioUris, promise)
    }

    OnActivityResult { _, payload ->
      val pending = pendingDeletes.remove(payload.requestCode) ?: return@OnActivityResult
      if (payload.resultCode == Activity.RESULT_OK) {
        // The OS confirmed the file deletions. Try to drop the now-empty
        // folder shells too — MediaStore can't do this, but a direct
        // File.delete() works as long as we have write access and the
        // folder is genuinely empty.
        for (path in pending.absoluteFolderPaths) {
          runCatching { java.io.File(path).delete() }
        }
        pending.promise.resolve(
          mapOf(
            "deletedUris" to pending.uris,
            "failedUris" to emptyList<String>(),
          ),
        )
      } else {
        pending.promise.resolve(
          mapOf(
            "deletedUris" to emptyList<String>(),
            "failedUris" to pending.uris,
          ),
        )
      }
    }
  }

  private fun deleteTracks(uris: List<String>, promise: Promise) {
    if (uris.isEmpty()) {
      promise.resolve(mapOf("deletedUris" to emptyList<String>(), "failedUris" to emptyList<String>()))
      return
    }
    if (!hasAudioPermission()) {
      promise.reject(CodedException("E_DELETE_PERMISSION", "Audio permission not granted", null))
      return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject(CodedException("E_DELETE_NO_ACTIVITY", "No current activity to host delete dialog", null))
        return
      }
      val parsed = uris.mapNotNull { runCatching { Uri.parse(it) }.getOrNull() }
      if (parsed.isEmpty()) {
        promise.resolve(mapOf("deletedUris" to emptyList<String>(), "failedUris" to uris))
        return
      }
      try {
        val pendingIntent = MediaStore.createDeleteRequest(ctx.contentResolver, parsed)
        val requestCode = nextDeleteRequestCode++
        pendingDeletes[requestCode] = PendingDelete(uris, promise)
        activity.startIntentSenderForResult(
          pendingIntent.intentSender,
          requestCode,
          null,
          0,
          0,
          0,
          null,
        )
      } catch (t: Throwable) {
        promise.reject(CodedException("E_DELETE_FAILED", t.message ?: "Failed to start delete request", t))
      }
      return
    }

    // API < 30: best-effort direct delete via ContentResolver.
    val deleted = mutableListOf<String>()
    val failed = mutableListOf<String>()
    for (uriString in uris) {
      try {
        val uri = Uri.parse(uriString)
        val rows = ctx.contentResolver.delete(uri, null, null)
        if (rows > 0) deleted += uriString else failed += uriString
      } catch (_: Throwable) {
        failed += uriString
      }
    }
    promise.resolve(mapOf("deletedUris" to deleted, "failedUris" to failed))
  }

  /**
   * Delete every file (audio, images, sidecars, etc.) that sits in the same
   * folder as the supplied audio URIs. On scoped-storage Android the OS won't
   * let us delete directories directly, so emptying every file in the folder
   * is the closest thing — once empty, the folder is effectively gone.
   */
  private fun deleteAlbumFolder(audioUris: List<String>, promise: Promise) {
    if (audioUris.isEmpty()) {
      promise.resolve(mapOf("deletedUris" to emptyList<String>(), "failedUris" to emptyList<String>()))
      return
    }
    if (!hasAudioPermission()) {
      promise.reject(CodedException("E_DELETE_PERMISSION", "Audio permission not granted", null))
      return
    }

    val folderPaths = collectFolderPaths(audioUris)
    if (folderPaths.isEmpty()) {
      // Couldn't resolve folder — fall through to a track-only delete.
      deleteTracks(audioUris, promise)
      return
    }

    val allUris = collectFolderFileUris(folderPaths)
    if (allUris.isEmpty()) {
      deleteTracks(audioUris, promise)
      return
    }

    val absoluteFolderPaths = resolveAbsoluteFolderPaths(folderPaths)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject(CodedException("E_DELETE_NO_ACTIVITY", "No current activity to host delete dialog", null))
        return
      }
      val parsed = allUris.mapNotNull { runCatching { Uri.parse(it) }.getOrNull() }
      if (parsed.isEmpty()) {
        promise.resolve(mapOf("deletedUris" to emptyList<String>(), "failedUris" to allUris))
        return
      }
      try {
        val pendingIntent = MediaStore.createDeleteRequest(ctx.contentResolver, parsed)
        val requestCode = nextDeleteRequestCode++
        // Report only the audio URIs back as "deleted" so the JS layer can
        // reconcile the library cache; the extra files are byproducts.
        pendingDeletes[requestCode] = PendingDelete(audioUris, promise, absoluteFolderPaths)
        activity.startIntentSenderForResult(
          pendingIntent.intentSender,
          requestCode,
          null,
          0,
          0,
          0,
          null,
        )
      } catch (t: Throwable) {
        promise.reject(CodedException("E_DELETE_FAILED", t.message ?: "Failed to start delete request", t))
      }
      return
    }

    // API < 30 fallback: best-effort direct delete of every file.
    val deletedAudio = mutableListOf<String>()
    val failedAudio = mutableListOf<String>()
    val audioSet = audioUris.toSet()
    for (uriString in allUris) {
      try {
        val rows = ctx.contentResolver.delete(Uri.parse(uriString), null, null)
        if (uriString in audioSet) {
          if (rows > 0) deletedAudio += uriString else failedAudio += uriString
        }
      } catch (_: Throwable) {
        if (uriString in audioSet) failedAudio += uriString
      }
    }
    for (path in absoluteFolderPaths) {
      runCatching { java.io.File(path).delete() }
    }
    promise.resolve(mapOf("deletedUris" to deletedAudio, "failedUris" to failedAudio))
  }

  /**
   * For each audio URI, look up its `RELATIVE_PATH` in MediaStore and return
   * the de-duplicated set of folder paths.
   */
  private fun collectFolderPaths(audioUris: List<String>): Set<String> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return emptySet()
    val ids = audioUris.mapNotNull { runCatching { ContentUris.parseId(Uri.parse(it)) }.getOrNull() }
    if (ids.isEmpty()) return emptySet()
    val placeholders = ids.joinToString(",") { "?" }
    val args = ids.map { it.toString() }.toTypedArray()
    val out = mutableSetOf<String>()
    ctx.contentResolver.query(
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
      arrayOf(MediaStore.MediaColumns.RELATIVE_PATH),
      "${MediaStore.MediaColumns._ID} IN ($placeholders)",
      args,
      null,
    )?.use { c ->
      val pathIdx = c.getColumnIndex(MediaStore.MediaColumns.RELATIVE_PATH)
      if (pathIdx < 0) return@use
      while (c.moveToNext()) {
        val rel = c.getStringOrNull(pathIdx) ?: continue
        // Normalize: strip trailing slash; keep one form for matching.
        out += rel.trimEnd('/')
      }
    }
    return out
  }

  /**
   * Collect content URIs for every file in the given folders, queried from
   * each typed MediaStore collection separately. We can't use
   * `MediaStore.Files` here because `MediaStore.createDeleteRequest` rejects
   * Files-collection URIs with "All requested items must be Media items".
   */
  private fun collectFolderFileUris(folders: Set<String>): List<String> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || folders.isEmpty()) return emptyList()
    val out = mutableListOf<String>()
    val typedCollections = listOf(
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
      MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
      MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
    )
    val orClauses = mutableListOf<String>()
    val args = mutableListOf<String>()
    for (folder in folders) {
      orClauses += "${MediaStore.MediaColumns.RELATIVE_PATH} = ?"
      args += "$folder/"
      orClauses += "${MediaStore.MediaColumns.RELATIVE_PATH} = ?"
      args += folder
    }
    val selection = orClauses.joinToString(" OR ")
    for (collection in typedCollections) {
      ctx.contentResolver.query(
        collection,
        arrayOf(MediaStore.MediaColumns._ID),
        selection,
        args.toTypedArray(),
        null,
      )?.use { c ->
        val idIdx = c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
        while (c.moveToNext()) {
          val id = c.getLong(idIdx)
          out += ContentUris.withAppendedId(collection, id).toString()
        }
      }
    }
    return out
  }

  /**
   * Resolve relative MediaStore paths (e.g. `Music/Mastodon/Leviathan`) to
   * absolute filesystem paths under the primary external storage volume so
   * we can `File.delete()` the empty folder shell after MediaStore drops
   * the files. The paths returned aren't guaranteed to exist or be
   * deletable — callers should swallow failures.
   */
  private fun resolveAbsoluteFolderPaths(relativeFolders: Set<String>): Set<String> {
    if (relativeFolders.isEmpty()) return emptySet()
    val externalRoot = android.os.Environment.getExternalStorageDirectory()?.absolutePath
      ?: return emptySet()
    return relativeFolders
      .map { rel -> "$externalRoot/${rel.trim('/')}" }
      .toSet()
  }

  private val ctx get() = appContext.reactContext
    ?: throw CodedException("E_NO_CONTEXT", "React context unavailable", null)

  /**
   * Watch MediaStore audio for changes (transfers, scans, deletes) so the JS
   * layer can refresh the library without the user having to open settings or
   * pull to refresh. Fires `mediaChanged` debounced ~750ms.
   */
  private fun registerMediaObserver() {
    if (mediaObserver != null) return
    val context = appContext.reactContext ?: return
    val observer = object : ContentObserver(mainHandler) {
      override fun onChange(selfChange: Boolean, uri: Uri?) {
        mainHandler.removeCallbacks(mediaChangedDebounce)
        mainHandler.postDelayed(mediaChangedDebounce, 750L)
      }
    }
    context.contentResolver.registerContentObserver(
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
      true,
      observer,
    )
    mediaObserver = observer
  }

  private fun unregisterMediaObserver() {
    val observer = mediaObserver ?: return
    mainHandler.removeCallbacks(mediaChangedDebounce)
    appContext.reactContext?.contentResolver?.unregisterContentObserver(observer)
    mediaObserver = null
  }

  private fun audioPermissionName(): String =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU)
      Manifest.permission.READ_MEDIA_AUDIO
    else
      Manifest.permission.READ_EXTERNAL_STORAGE

  private fun hasAudioPermission(): Boolean =
    ContextCompat.checkSelfPermission(ctx, audioPermissionName()) == PackageManager.PERMISSION_GRANTED

  private fun requirePermission() {
    if (!hasAudioPermission()) {
      throw CodedException("E_PERM_DENIED", "Audio permission not granted", null)
    }
  }

  private fun projection(): Array<String> {
    val cols = mutableListOf(
      MediaStore.Audio.Media._ID,
      MediaStore.Audio.Media.TITLE,
      MediaStore.Audio.Media.ARTIST,
      MediaStore.Audio.Media.ALBUM,
      MediaStore.Audio.Media.DURATION,
      MediaStore.Audio.Media.YEAR,
      MediaStore.Audio.Media.TRACK,
      MediaStore.Audio.Media.MIME_TYPE,
      MediaStore.Audio.Media.SIZE,
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      cols += MediaStore.Audio.Media.ALBUM_ARTIST
      cols += MediaStore.Audio.Media.GENRE
    }
    return cols.toTypedArray()
  }

  private fun scan(options: Map<String, Any?>): List<Map<String, Any?>> {
    val limit = (options["limit"] as? Number)?.toInt() ?: 0
    val minDurationMs = (options["minDurationMs"] as? Number)?.toLong() ?: 0L
    val selection = buildString {
      append("${MediaStore.Audio.Media.IS_MUSIC} != 0")
      if (minDurationMs > 0) append(" AND ${MediaStore.Audio.Media.DURATION} >= $minDurationMs")
    }
    return query(selection, null, limit)
  }

  private fun search(q: String, limit: Int): List<Map<String, Any?>> {
    val pattern = "%${q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")}%"
    val cols = mutableListOf(
      MediaStore.Audio.Media.TITLE,
      MediaStore.Audio.Media.ARTIST,
      MediaStore.Audio.Media.ALBUM,
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      cols += MediaStore.Audio.Media.ALBUM_ARTIST
      cols += MediaStore.Audio.Media.GENRE
    }
    val likeClause = cols.joinToString(" OR ") { "$it LIKE ? ESCAPE '\\'" }
    val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0 AND ($likeClause)"
    val args = Array(cols.size) { pattern }
    return query(selection, args, limit)
  }

  private fun query(selection: String, args: Array<String>?, limit: Int): List<Map<String, Any?>> {
    val out = mutableListOf<Map<String, Any?>>()
    val sort = buildString {
      append("${MediaStore.Audio.Media.ARTIST} COLLATE NOCASE, ")
      append("${MediaStore.Audio.Media.ALBUM} COLLATE NOCASE, ")
      append(MediaStore.Audio.Media.TRACK)
      if (limit > 0) append(" LIMIT $limit")
    }
    ctx.contentResolver.query(
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
      projection(),
      selection,
      args,
      sort,
    )?.use { c ->
      val idIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
      val titleIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
      val artistIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
      val albumIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
      val durIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
      val yearIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.YEAR)
      val trackIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.TRACK)
      val mimeIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)
      val sizeIdx = c.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)
      val albumArtistIdx = c.getColumnIndex("album_artist")
      val genreIdx = c.getColumnIndex("genre")

      while (c.moveToNext()) {
        val id = c.getLong(idIdx)
        val trackRaw = c.getInt(trackIdx)
        out += mapOf(
          "id" to id.toString(),
          "uri" to ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString(),
          "title" to c.getStringOrNull(titleIdx),
          "artist" to c.getStringOrNull(artistIdx),
          "album" to c.getStringOrNull(albumIdx),
          "albumArtist" to if (albumArtistIdx >= 0) c.getStringOrNull(albumArtistIdx) else null,
          "genre" to if (genreIdx >= 0) c.getStringOrNull(genreIdx) else null,
          "durationMs" to c.getLong(durIdx),
          "year" to c.getInt(yearIdx).takeIf { it > 0 },
          "trackNumber" to (trackRaw % 1000).takeIf { trackRaw > 0 },
          "discNumber" to (trackRaw / 1000).takeIf { trackRaw >= 1000 },
          "mimeType" to c.getStringOrNull(mimeIdx),
          "sizeBytes" to c.getLong(sizeIdx),
        )
      }
    }
    return out
  }

  private fun readTrackTags(uriString: String): Map<String, Any?>? {
    val r = MediaMetadataRetriever()
    return try {
      r.setDataSource(ctx, Uri.parse(uriString))
      mapOf(
        "title" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE),
        "artist" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST),
        "album" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM),
        "albumArtist" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUMARTIST),
        "genre" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_GENRE),
        "year" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_YEAR)?.toIntOrNull(),
        "date" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DATE),
        "trackNumber" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_CD_TRACK_NUMBER),
        "discNumber" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DISC_NUMBER),
        "composer" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_COMPOSER),
        "durationMs" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull(),
        "bitrate" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_BITRATE)?.toIntOrNull(),
        "sampleRate" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
          r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_SAMPLERATE)?.toIntOrNull() else null,
        "mimeType" to r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE),
        "hasArtwork" to (r.embeddedPicture != null),
      )
    } catch (_: Throwable) {
      null
    } finally {
      r.release()
    }
  }

  private fun readArtwork(uriString: String): Map<String, Any?>? {
    val r = MediaMetadataRetriever()
    return try {
      r.setDataSource(ctx, Uri.parse(uriString))
      val bytes = r.embeddedPicture ?: return null
      mapOf(
        "base64" to Base64.encodeToString(bytes, Base64.NO_WRAP),
        "mimeType" to (r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE) ?: "image/jpeg"),
        "byteLength" to bytes.size,
      )
    } catch (_: Throwable) {
      null
    } finally {
      r.release()
    }
  }

  @Suppress("unused")
  private fun Cursor.optString(name: String): String? {
    val i = getColumnIndex(name)
    return if (i < 0 || isNull(i)) null else getString(i)
  }

  // ---- lyrics --------------------------------------------------------------

  /**
   * Best-effort lyric tag reader. Supports:
   *   - ID3v2 USLT/SYLT frames (MP3, sometimes WAV/AIFF)
   *   - Vorbis-comment LYRICS / UNSYNCEDLYRICS (FLAC, OGG)
   *
   * Returns null when no lyric tag is present. Synced lyrics are flattened to
   * plain text (timestamps stripped) so the UI can treat both forms uniformly.
   */
  private fun readLyrics(uriString: String): Map<String, Any?>? {
    val uri = try { Uri.parse(uriString) } catch (_: Throwable) { return null }
    return try {
      ctx.contentResolver.openInputStream(uri)?.use { input ->
        // Read up to 1 MiB — enough for typical metadata blocks without slurping a full track.
        val limit = 1 shl 20
        val buffer = ByteArray(limit)
        var read = 0
        while (read < limit) {
          val n = input.read(buffer, read, limit - read)
          if (n <= 0) break
          read += n
        }
        val bytes = if (read == limit) buffer else buffer.copyOf(read)
        extractLyricsFromBytes(bytes)
      }
    } catch (_: Throwable) {
      null
    }
  }

  private fun extractLyricsFromBytes(bytes: ByteArray): Map<String, Any?>? {
    return parseId3v2Lyrics(bytes) ?: parseVorbisLyrics(bytes)
  }

  /** Parse ID3v2.3/2.4 USLT (or SYLT) frames at the start of the file. */
  private fun parseId3v2Lyrics(b: ByteArray): Map<String, Any?>? {
    if (b.size < 10) return null
    if (b[0] != 'I'.code.toByte() || b[1] != 'D'.code.toByte() || b[2] != '3'.code.toByte()) return null
    val major = b[3].toInt() and 0xFF
    if (major !in 2..4) return null
    val flags = b[5].toInt() and 0xFF
    val tagSize = synchsafe(b, 6)
    val tagEnd = (10 + tagSize).coerceAtMost(b.size)
    var p = 10
    if ((flags and 0x40) != 0 && major >= 3) {
      // skip extended header
      val extSize = if (major == 4) synchsafe(b, p) else readInt32(b, p)
      p += 4 + extSize.coerceAtLeast(0)
    }
    while (p + 10 <= tagEnd) {
      val id = String(b, p, 4, Charsets.ISO_8859_1)
      if (id[0] == '\u0000') break
      val frameSize = if (major == 4) synchsafe(b, p + 4) else readInt32(b, p + 4)
      val frameEnd = p + 10 + frameSize
      if (frameSize <= 0 || frameEnd > tagEnd) break
      if (id == "USLT" || id == "SYLT") {
        val frameBody = b.copyOfRange(p + 10, frameEnd)
        val parsed = parseUsltFrame(frameBody, sync = id == "SYLT")
        if (parsed != null) return parsed
      }
      p = frameEnd
    }
    return null
  }

  private fun parseUsltFrame(body: ByteArray, sync: Boolean): Map<String, Any?>? {
    if (body.size < 5) return null
    val encoding = body[0].toInt() and 0xFF
    val lang = String(body, 1, 3, Charsets.ISO_8859_1).trim().lowercase()
    var p = 4
    val charset = when (encoding) {
      0 -> Charsets.ISO_8859_1
      1, 2 -> Charsets.UTF_16
      3 -> Charsets.UTF_8
      else -> Charsets.ISO_8859_1
    }
    // Skip the content descriptor (null-terminated string in the frame's encoding).
    val descEnd = findNullTerminator(body, p, encoding)
    if (descEnd < 0) return null
    p = descEnd
    if (p >= body.size) return null
    val rawText = String(body, p, body.size - p, charset)
    val text = if (sync) stripSyncTimestamps(rawText) else rawText
    val trimmed = text.trim()
    if (trimmed.isEmpty()) return null
    return mapOf(
      "text" to trimmed,
      "language" to lang.ifBlank { null },
    )
  }

  /** SYLT is a sequence of <text>\0\xHHHH timestamp; we just keep the text. */
  private fun stripSyncTimestamps(s: String): String {
    val out = StringBuilder()
    for (ch in s) {
      if (ch.code in 0x20..0x10FFFF || ch == '\n' || ch == '\r' || ch == '\t') out.append(ch)
    }
    return out.toString()
  }

  /** Index past a null terminator in the given text encoding (ID3 byte 0). */
  private fun findNullTerminator(body: ByteArray, start: Int, encoding: Int): Int {
    var i = start
    return when (encoding) {
      1, 2 -> {
        // UTF-16 — terminator is two null bytes on a 2-byte boundary.
        // First, the descriptor may begin with a BOM; we just walk pairs.
        while (i + 1 < body.size) {
          if (body[i] == 0.toByte() && body[i + 1] == 0.toByte()) return i + 2
          i += 2
        }
        -1
      }
      else -> {
        while (i < body.size) {
          if (body[i] == 0.toByte()) return i + 1
          i++
        }
        -1
      }
    }
  }

  private fun synchsafe(b: ByteArray, offset: Int): Int {
    if (offset + 4 > b.size) return 0
    return ((b[offset].toInt() and 0x7F) shl 21) or
      ((b[offset + 1].toInt() and 0x7F) shl 14) or
      ((b[offset + 2].toInt() and 0x7F) shl 7) or
      (b[offset + 3].toInt() and 0x7F)
  }

  private fun readInt32(b: ByteArray, offset: Int): Int {
    if (offset + 4 > b.size) return 0
    return ((b[offset].toInt() and 0xFF) shl 24) or
      ((b[offset + 1].toInt() and 0xFF) shl 16) or
      ((b[offset + 2].toInt() and 0xFF) shl 8) or
      (b[offset + 3].toInt() and 0xFF)
  }

  // ---- synchronised lyrics (.lrc sidecar) ---------------------------------

  /**
   * Look up a sibling .lrc file for the given audio URI and parse its timed
   * lines. Returns { lines: [{startMs, text}, ...] } sorted by startMs, or
   * null when no sidecar exists, the file is unreadable, or it contains no
   * valid timed lines.
   */
  private fun readSyncedLyrics(uriString: String): Map<String, Any?>? {
    val audioUri = try { Uri.parse(uriString) } catch (_: Throwable) { return null }
    val (relativePath, displayName) = lookupAudioMetadata(audioUri) ?: return null
    val stem = displayName.substringBeforeLast('.', displayName)
    val lrcUri = findSidecarUri(relativePath, "$stem.lrc") ?: return null

    val text = try {
      ctx.contentResolver.openInputStream(lrcUri)?.use { input ->
        input.readBytes().toString(Charsets.UTF_8)
      }
    } catch (_: Throwable) {
      null
    } ?: return null

    val lines = parseLrc(text)
    return if (lines.isEmpty()) null else mapOf("lines" to lines)
  }

  private fun lookupAudioMetadata(audioUri: Uri): Pair<String, String>? {
    return try {
      ctx.contentResolver.query(
        audioUri,
        arrayOf(MediaStore.MediaColumns.RELATIVE_PATH, MediaStore.MediaColumns.DISPLAY_NAME),
        null, null, null,
      )?.use { c ->
        if (!c.moveToFirst()) return null
        val rel = c.getStringOrNull(c.getColumnIndex(MediaStore.MediaColumns.RELATIVE_PATH)) ?: return null
        val name = c.getStringOrNull(c.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)) ?: return null
        rel to name
      }
    } catch (_: Throwable) {
      null
    }
  }

  private fun findSidecarUri(relativePath: String, lrcDisplayName: String): Uri? {
    val collection = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL)
    val folderWithSlash = if (relativePath.endsWith('/')) relativePath else "$relativePath/"
    val folderWithout = folderWithSlash.trimEnd('/')

    return try {
      ctx.contentResolver.query(
        collection,
        arrayOf(MediaStore.MediaColumns._ID),
        "(${MediaStore.MediaColumns.RELATIVE_PATH} = ? OR ${MediaStore.MediaColumns.RELATIVE_PATH} = ?) AND ${MediaStore.MediaColumns.DISPLAY_NAME} = ?",
        arrayOf(folderWithSlash, folderWithout, lrcDisplayName),
        null,
      )?.use { c ->
        if (!c.moveToFirst()) return null
        val idIdx = c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)
        val id = c.getLong(idIdx)
        ContentUris.withAppendedId(collection, id)
      }
    } catch (_: Throwable) {
      null
    }
  }

  private val lrcTimestampLine = Regex("""\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?]""")
  private val lrcMetadataLine = Regex("""^\[(?:ar|ti|al|au|by|length|offset|re|tool|ve):""", RegexOption.IGNORE_CASE)

  private fun parseLrc(text: String): List<Map<String, Any?>> {
    val out = mutableListOf<Pair<Int, String>>()
    text.split('\n').forEach { rawLine ->
      val line = rawLine.trimEnd('\r')
      if (line.isBlank()) return@forEach
      if (lrcMetadataLine.containsMatchIn(line.trimStart())) return@forEach

      val matches = lrcTimestampLine.findAll(line).toList()
      if (matches.isEmpty()) return@forEach

      val tail = line.substring(matches.last().range.last + 1).trim()
      matches.forEach { m ->
        val mins = m.groupValues[1].toIntOrNull() ?: return@forEach
        val secs = m.groupValues[2].toIntOrNull() ?: return@forEach
        val fracRaw = m.groupValues.getOrNull(3) ?: ""
        val fracMs = when {
          fracRaw.isEmpty() -> 0
          fracRaw.length == 1 -> fracRaw.toInt() * 100
          fracRaw.length == 2 -> fracRaw.toInt() * 10
          else -> fracRaw.take(3).toInt()
        }
        val startMs = ((mins * 60) + secs) * 1000 + fracMs
        out += startMs to tail
      }
    }
    return out
      .sortedBy { it.first }
      .map { (start, txt) -> mapOf("startMs" to start, "text" to txt) }
  }

  // ---- extras (country / metal archives url) ------------------------------

  /**
   * Reads user-defined ID3v2 TXXX frames written by the desktop app:
   *   TXXX[COUNTRY] -> band's country of origin
   *   TXXX[METAL_ARCHIVES_URL] -> encyclopaediametallum.com album page
   * Returns null when neither is present.
   */
  private fun readExtras(uriString: String): Map<String, Any?>? {
    val uri = try { Uri.parse(uriString) } catch (_: Throwable) { return null }
    return try {
      ctx.contentResolver.openInputStream(uri)?.use { input ->
        val limit = 1 shl 20
        val buffer = ByteArray(limit)
        var read = 0
        while (read < limit) {
          val n = input.read(buffer, read, limit - read)
          if (n <= 0) break
          read += n
        }
        val bytes = if (read == limit) buffer else buffer.copyOf(read)
        parseId3v2Txxx(bytes)
      }
    } catch (_: Throwable) {
      null
    }
  }

  private fun parseId3v2Txxx(b: ByteArray): Map<String, Any?>? {
    if (b.size < 10) return null
    if (b[0] != 'I'.code.toByte() || b[1] != 'D'.code.toByte() || b[2] != '3'.code.toByte()) return null
    val major = b[3].toInt() and 0xFF
    if (major !in 2..4) return null
    val flags = b[5].toInt() and 0xFF
    val tagSize = synchsafe(b, 6)
    val tagEnd = (10 + tagSize).coerceAtMost(b.size)
    var p = 10
    if ((flags and 0x40) != 0 && major >= 3) {
      val extSize = if (major == 4) synchsafe(b, p) else readInt32(b, p)
      p += 4 + extSize.coerceAtLeast(0)
    }
    var country: String? = null
    var metalArchivesUrl: String? = null
    while (p + 10 <= tagEnd) {
      val id = String(b, p, 4, Charsets.ISO_8859_1)
      if (id[0] == '\u0000') break
      val frameSize = if (major == 4) synchsafe(b, p + 4) else readInt32(b, p + 4)
      val frameEnd = p + 10 + frameSize
      if (frameSize <= 0 || frameEnd > tagEnd) break
      if (id == "TXXX") {
        val pair = parseTxxxFrame(b.copyOfRange(p + 10, frameEnd))
        if (pair != null) {
          val (description, value) = pair
          when (description.uppercase()) {
            "COUNTRY" -> if (country == null) country = value
            "METAL_ARCHIVES_URL" -> if (metalArchivesUrl == null) metalArchivesUrl = value
          }
        }
      }
      p = frameEnd
    }
    if (country == null && metalArchivesUrl == null) return null
    return mapOf(
      "country" to country,
      "metalArchivesUrl" to metalArchivesUrl,
    )
  }

  private fun parseTxxxFrame(body: ByteArray): Pair<String, String>? {
    if (body.size < 2) return null
    val encoding = body[0].toInt() and 0xFF
    val charset = when (encoding) {
      0 -> Charsets.ISO_8859_1
      1, 2 -> Charsets.UTF_16
      3 -> Charsets.UTF_8
      else -> Charsets.ISO_8859_1
    }
    val descEnd = findNullTerminator(body, 1, encoding)
    if (descEnd < 0) return null
    val descBytes = body.copyOfRange(1, descEnd - if (encoding == 1 || encoding == 2) 2 else 1)
    val description = String(descBytes, charset).trim()
    if (descEnd >= body.size) return null
    // Value runs to end-of-frame; some writers append a terminator we should drop.
    var valueEnd = body.size
    if ((encoding == 1 || encoding == 2) && valueEnd >= descEnd + 2 &&
        body[valueEnd - 2] == 0.toByte() && body[valueEnd - 1] == 0.toByte()) {
      valueEnd -= 2
    } else if (encoding != 1 && encoding != 2 && valueEnd > descEnd && body[valueEnd - 1] == 0.toByte()) {
      valueEnd -= 1
    }
    if (valueEnd <= descEnd) return null
    val value = String(body, descEnd, valueEnd - descEnd, charset).trim()
    if (description.isEmpty() || value.isEmpty()) return null
    return description to value
  }

  /**
   * Naive Vorbis-comment scan: search the buffer (likely FLAC or OGG header)
   * for any LYRICS=... or UNSYNCEDLYRICS=... entry. Comments are UTF-8.
   */
  private fun parseVorbisLyrics(b: ByteArray): Map<String, Any?>? {
    val haystack = try { String(b, Charsets.UTF_8) } catch (_: Throwable) { return null }
    val keys = listOf("UNSYNCEDLYRICS=", "LYRICS=", "unsyncedlyrics=", "lyrics=")
    for (key in keys) {
      val start = haystack.indexOf(key)
      if (start < 0) continue
      val from = start + key.length
      // Vorbis comment values are length-prefixed in the binary stream; we
      // can't reconstruct that from a string view, so cap at the next NUL or
      // sequence of unprintable bytes.
      var end = from
      while (end < haystack.length) {
        val c = haystack[end]
        // Vorbis values terminate when the next length-prefix begins, which
        // typically presents as a low control byte or a non-printable run.
        if (c.code < 0x09 || (c.code in 0x0E..0x1F)) break
        end++
      }
      val text = haystack.substring(from, end).trim()
      if (text.isNotEmpty()) {
        return mapOf("text" to text, "language" to null)
      }
    }
    return null
  }
}
