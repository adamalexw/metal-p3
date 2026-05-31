package expo.modules.metalp3player.auto

import android.content.Context
import org.json.JSONArray

/**
 * Native-side playlist cache populated by the JS layer. Playlists are owned
 * by JS (AsyncStorage), but the Android Auto browse tree needs synchronous
 * access — so JS pushes the playlist list to native after every mutation
 * via [MetalP3PlayerModule.setPlaylistsAsync], and we mirror it here in
 * SharedPreferences for AA's MediaLibraryService callback to read.
 */
internal object PlaylistStore {

  private const val PREFS = "metalp3_playlists"
  private const val KEY = "playlists_v1"

  data class Entry(val id: String, val name: String, val trackIds: List<Long>)

  fun write(context: Context, json: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit().putString(KEY, json).apply()
  }

  fun list(context: Context): List<Entry> {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY, null) ?: return emptyList()
    return parse(raw)
  }

  fun byId(context: Context, id: String): Entry? = list(context).firstOrNull { it.id == id }

  /**
   * Accepts the JSON array of playlists shaped like `playlist-store.ts`:
   *   [{ id, name, trackIds: ["123", "456", ...] }, ...]
   * trackIds are MediaStore audio IDs as strings (the same form the JS
   * library scan returns).
   */
  private fun parse(raw: String): List<Entry> = try {
    val arr = JSONArray(raw)
    val out = ArrayList<Entry>(arr.length())
    for (i in 0 until arr.length()) {
      val obj = arr.optJSONObject(i) ?: continue
      val id = obj.optString("id").takeIf { it.isNotBlank() } ?: continue
      val name = obj.optString("name").takeIf { it.isNotBlank() } ?: continue
      val tracksJson = obj.optJSONArray("trackIds") ?: continue
      val tracks = ArrayList<Long>(tracksJson.length())
      for (j in 0 until tracksJson.length()) {
        val s = tracksJson.optString(j) ?: continue
        s.toLongOrNull()?.let(tracks::add)
      }
      out += Entry(id, name, tracks)
    }
    out
  } catch (_: Throwable) {
    emptyList()
  }
}
