package expo.modules.metalp3player.widget

import android.graphics.Bitmap

/**
 * Lightweight, thread-safe snapshot the [PlaybackService] publishes for the
 * home-screen widget to render. The widget renderer never talks to ExoPlayer or
 * MediaController directly — it just reads these fields.
 */
data class WidgetSnapshot(
  val title: String?,
  val artist: String?,
  val isPlaying: Boolean,
  val hasQueue: Boolean,
  val artwork: Bitmap?,
) {
  companion object {
    val EMPTY = WidgetSnapshot(null, null, false, false, null)
  }
}
