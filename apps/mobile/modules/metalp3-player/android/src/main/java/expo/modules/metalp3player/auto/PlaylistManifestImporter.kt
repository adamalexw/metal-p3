package expo.modules.metalp3player.auto

import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Reads playlist manifest JSON files pushed from the desktop via ADB
 * (see [com.metalp3 backend AdbService.transferPlaylistManifest]) and
 * resolves each manifest's `relativePath` entries to MediaStore audio
 * `_ID`s so the JS playlist store can rebuild the same ordered playlist.
 *
 * Manifest layout on disk:
 *   /storage/emulated/0/Music/.metalp3/playlists/<slug>.json
 *
 * Manifest payload:
 *   {
 *     "version": 1,
 *     "name": "<playlist name>",
 *     "transferredAt": <epoch ms>,
 *     "tracks": [{ "index": 0, "relativePath": "ArtistFolder/01 - Track.mp3" }, ...]
 *   }
 *
 * A manifest is only deleted after every track resolves — otherwise it
 * stays on disk so the next reconcile (typically on app focus) can retry
 * once MediaScanner has caught up to recently-pushed files.
 */
internal object PlaylistManifestImporter {

  data class Imported(val name: String, val trackIds: List<String>)

  fun importAll(ctx: Context): List<Imported> {
    val dir = manifestDir() ?: return emptyList()
    if (!dir.exists() || !dir.isDirectory) return emptyList()
    val files = dir.listFiles { f -> f.isFile && f.name.endsWith(".json", ignoreCase = true) }
      ?: return emptyList()

    val out = ArrayList<Imported>(files.size)
    for (file in files) {
      val parsed = parse(file) ?: continue
      val resolved = resolveTracks(ctx, parsed.tracks)
      if (resolved == null) {
        // Some tracks not yet indexed; keep the manifest for next pass.
        continue
      }
      out += Imported(parsed.name, resolved)
      try {
        file.delete()
      } catch (_: Throwable) {
        // best effort — duplicate import next time is harmless (same name → in-place replace)
      }
    }
    return out
  }

  private fun manifestDir(): File? {
    val music = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
    } else {
      Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
    } ?: return null
    return File(music, ".metalp3/playlists")
  }

  private data class Parsed(val name: String, val tracks: List<String>)

  private fun parse(file: File): Parsed? = try {
    val raw = file.readText(Charsets.UTF_8)
    val obj = JSONObject(raw)
    val name = obj.optString("name").trim().takeIf { it.isNotEmpty() } ?: return null
    val arr = obj.optJSONArray("tracks") ?: JSONArray()
    val ordered = ArrayList<Pair<Int, String>>(arr.length())
    for (i in 0 until arr.length()) {
      val t = arr.optJSONObject(i) ?: continue
      val rel = t.optString("relativePath").trim().takeIf { it.isNotEmpty() } ?: continue
      val idx = t.optInt("index", i)
      ordered += idx to rel
    }
    Parsed(name, ordered.sortedBy { it.first }.map { it.second })
  } catch (_: Throwable) {
    null
  }

  /**
   * Returns the audio `_ID` for every relativePath in order, or null if
   * any one entry can't be resolved (so the caller can defer the import).
   */
  private fun resolveTracks(ctx: Context, relativePaths: List<String>): List<String>? {
    if (relativePaths.isEmpty()) return null
    val resolved = ArrayList<String>(relativePaths.size)
    for (path in relativePaths) {
      val id = lookupAudioId(ctx, path) ?: return null
      resolved += id.toString()
    }
    return resolved
  }

  private fun lookupAudioId(ctx: Context, relativePath: String): Long? {
    val normalised = relativePath.replace('\\', '/').trimStart('/')
    val lastSlash = normalised.lastIndexOf('/')
    val folder = if (lastSlash >= 0) normalised.substring(0, lastSlash) else ""
    val displayName = if (lastSlash >= 0) normalised.substring(lastSlash + 1) else normalised
    if (displayName.isBlank()) return null

    val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
    } else {
      MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      val musicRel = "Music/$folder".trimEnd('/')
      val withSlash = "$musicRel/"
      val selection = "(${MediaStore.MediaColumns.RELATIVE_PATH} = ? OR ${MediaStore.MediaColumns.RELATIVE_PATH} = ?) " +
        "AND ${MediaStore.MediaColumns.DISPLAY_NAME} = ? " +
        "AND ${MediaStore.Audio.Media.IS_MUSIC} = 1"
      val args = arrayOf(withSlash, musicRel, displayName)
      ctx.contentResolver.query(
        collection,
        arrayOf(MediaStore.Audio.Media._ID),
        selection,
        args,
        null,
      )?.use { c ->
        if (c.moveToFirst()) return c.getLong(0)
      }
      return null
    }

    // Pre-Q: fall back to DATA suffix match.
    val suffix = "/Music/$normalised"
    ctx.contentResolver.query(
      collection,
      arrayOf(MediaStore.Audio.Media._ID),
      "${MediaStore.Audio.Media.DATA} LIKE ? AND ${MediaStore.Audio.Media.IS_MUSIC} = 1",
      arrayOf("%$suffix"),
      null,
    )?.use { c ->
      if (c.moveToFirst()) return c.getLong(0)
    }
    return null
  }
}
