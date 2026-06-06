package expo.modules.metalp3player

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import org.json.JSONArray
import org.json.JSONObject

internal object PlaybackStateStore {
  private const val PREFS = "metalp3_playback_state"
  private const val KEY_QUEUE = "queue_json"
  private const val KEY_INDEX = "current_index"
  private const val KEY_POSITION = "position_ms"
  private const val KEY_REPEAT_MODE = "repeat_mode"
  private const val KEY_SHUFFLE = "shuffle_enabled"

  private const val TAG = "PlaybackStateStore"

  fun persist(context: Context, player: Player) {
    try {
      val itemCount = player.mediaItemCount
      if (itemCount == 0) {
        clear(context)
        return
      }

      val queueArray = JSONArray()
      for (i in 0 until itemCount) {
        val item = player.getMediaItemAt(i)
        val obj = JSONObject().apply {
          put("id", item.mediaId)
          put("uri", item.localConfiguration?.uri?.toString())
          val md = item.mediaMetadata
          put("title", md.title?.toString())
          put("artist", md.artist?.toString())
          put("album", md.albumTitle?.toString())
          put("albumArtist", md.albumArtist?.toString())
          put("artworkUri", md.artworkUri?.toString())
          if (md.durationMs != null) {
            put("durationMs", md.durationMs)
          }
        }
        queueArray.put(obj)
      }

      val index = player.currentMediaItemIndex
      val position = player.currentPosition
      val repeatMode = player.repeatMode
      val shuffle = player.shuffleModeEnabled

      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().apply {
        putString(KEY_QUEUE, queueArray.toString())
        putInt(KEY_INDEX, index)
        putLong(KEY_POSITION, position)
        putInt(KEY_REPEAT_MODE, repeatMode)
        putBoolean(KEY_SHUFFLE, shuffle)
      }.apply()
    } catch (e: Exception) {
      Log.w(TAG, "Failed to persist playback state", e)
    }
  }

  fun restore(context: Context, player: Player) {
    try {
      val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      val queueStr = prefs.getString(KEY_QUEUE, null) ?: return
      val queueArray = JSONArray(queueStr)
      if (queueArray.length() == 0) return

      val mediaItems = mutableListOf<MediaItem>()
      for (i in 0 until queueArray.length()) {
        val obj = queueArray.getJSONObject(i)
        val id = obj.optString("id")
        val uriStr = obj.optString("uri")
        if (uriStr.isNullOrBlank()) continue
        val uri = Uri.parse(uriStr)
        val explicitArtworkUri = obj.optString("artworkUri").takeIf { it.isNotEmpty() }
        val metadata = MediaMetadata.Builder()
          .setTitle(obj.optString("title").takeIf { it.isNotEmpty() })
          .setArtist(obj.optString("artist").takeIf { it.isNotEmpty() })
          .setAlbumTitle(obj.optString("album").takeIf { it.isNotEmpty() })
          .setAlbumArtist(obj.optString("albumArtist").takeIf { it.isNotEmpty() })
          .setArtworkUri(Uri.parse(explicitArtworkUri ?: uriStr))
          .apply {
            if (obj.has("durationMs")) {
              val dur = obj.optLong("durationMs")
              if (dur > 0) setDurationMs(dur)
            }
          }
          .build()

        val item = MediaItem.Builder()
          .setMediaId(id.takeIf { it.isNotEmpty() } ?: uriStr)
          .setUri(uri)
          .setMediaMetadata(metadata)
          .build()
        mediaItems.add(item)
      }

      if (mediaItems.isEmpty()) return

      val index = prefs.getInt(KEY_INDEX, 0).coerceIn(0, mediaItems.size - 1)
      val position = prefs.getLong(KEY_POSITION, 0L)
      val repeatMode = prefs.getInt(KEY_REPEAT_MODE, Player.REPEAT_MODE_OFF)
      val shuffle = prefs.getBoolean(KEY_SHUFFLE, false)

      player.setMediaItems(mediaItems, index, position)
      player.repeatMode = repeatMode
      player.shuffleModeEnabled = shuffle
      player.prepare()
      Log.i(TAG, "Restored state: ${mediaItems.size} items, index=$index, position=$position")
    } catch (e: Exception) {
      Log.w(TAG, "Failed to restore playback state", e)
    }
  }

  fun clear(context: Context) {
    try {
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    } catch (e: Exception) {
      Log.w(TAG, "Failed to clear playback state", e)
    }
  }
}
