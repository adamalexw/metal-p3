package expo.modules.metalp3player.widget

import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.MoreExecutors
import expo.modules.metalp3player.PlaybackService

/**
 * Handles widget button clicks. Opens a transient MediaController, applies the
 * requested command, then releases the connection.
 */
object WidgetCommand {

  private val main = Handler(Looper.getMainLooper())

  /**
   * @param onDone called when the command has been applied (or when the
   *   controller failed to connect). Used by the BroadcastReceiver to release
   *   its goAsync() pending result so the OS can collect the process.
   */
  fun dispatch(ctx: Context, action: String, onDone: () -> Unit = {}) {
    main.post { runOnMain(ctx, action, onDone) }
  }

  private fun runOnMain(ctx: Context, action: String, onDone: () -> Unit) {
    val token = SessionToken(ctx, ComponentName(ctx, PlaybackService::class.java))
    val future = MediaController.Builder(ctx, token).buildAsync()
    future.addListener({
      val controller = try { future.get() } catch (_: Throwable) { null }
      if (controller != null) {
        try {
          when (action) {
            PlaybackWidgetProvider.ACTION_PLAY_PAUSE ->
              if (controller.isPlaying) controller.pause() else controller.play()
            PlaybackWidgetProvider.ACTION_NEXT -> controller.seekToNextMediaItem()
            PlaybackWidgetProvider.ACTION_PREV -> controller.seekToPreviousMediaItem()
            PlaybackWidgetProvider.ACTION_SHUFFLE ->
              controller.shuffleModeEnabled = !controller.shuffleModeEnabled
            PlaybackWidgetProvider.ACTION_REPEAT -> {
              controller.repeatMode = when (controller.repeatMode) {
                Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
                Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
                else -> Player.REPEAT_MODE_OFF
              }
            }
          }
        } finally {
          controller.release()
        }
      }
      // The service's own Player.Listener publishes a new snapshot and triggers
      // a widget refresh; nothing else to do here.
      onDone()
    }, MoreExecutors.directExecutor())
  }
}
