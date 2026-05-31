package expo.modules.metalp3player.widget

import android.graphics.Bitmap

/**
 * Lightweight, thread-safe snapshot the [PlaybackService] publishes for the
 * home-screen widget to render. The widget renderer never talks to ExoPlayer or
 * MediaController directly — it just reads these fields.
 *
 * `foreground`, `mutedForeground`, and `accent` are ARGB ints derived from the
 * artwork palette so the widget's text and icons stay legible against whatever
 * blurred album-art background it ends up showing.
 */
data class WidgetSnapshot(
  val title: String?,
  val artist: String?,
  val album: String?,
  val isPlaying: Boolean,
  val hasQueue: Boolean,
  val artwork: Bitmap?,
  val artworkBlurred: Bitmap?,
  val queueIndex: Int,
  val queueCount: Int,
  val shuffle: Boolean,
  /** "off" | "all" | "one" */
  val repeatMode: String,
  val canSkipNext: Boolean,
  val canSkipPrev: Boolean,
  val foreground: Int,
  val mutedForeground: Int,
  val accent: Int,
) {
  companion object {
    private const val DEFAULT_FG = 0xFFFFFFFF.toInt()
    private const val DEFAULT_MUTED = 0xFFC0C0C0.toInt()
    private const val DEFAULT_ACCENT = 0xFFE53935.toInt()

    val EMPTY = WidgetSnapshot(
      title = null,
      artist = null,
      album = null,
      isPlaying = false,
      hasQueue = false,
      artwork = null,
      artworkBlurred = null,
      queueIndex = -1,
      queueCount = 0,
      shuffle = false,
      repeatMode = "off",
      canSkipNext = false,
      canSkipPrev = false,
      foreground = DEFAULT_FG,
      mutedForeground = DEFAULT_MUTED,
      accent = DEFAULT_ACCENT,
    )
  }
}
