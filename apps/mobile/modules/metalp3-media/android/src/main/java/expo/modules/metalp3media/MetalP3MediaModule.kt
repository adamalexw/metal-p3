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
}
