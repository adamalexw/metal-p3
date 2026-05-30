package expo.modules.metalp3media

import android.Manifest
import android.content.ContentUris
import android.content.pm.PackageManager
import android.database.Cursor
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import androidx.core.content.ContextCompat
import androidx.core.database.getStringOrNull
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MetalP3MediaModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MetalP3Media")

    Constants(
      "audioPermission" to audioPermissionName(),
    )

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
  }

  private val ctx get() = appContext.reactContext
    ?: throw CodedException("E_NO_CONTEXT", "React context unavailable", null)

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
