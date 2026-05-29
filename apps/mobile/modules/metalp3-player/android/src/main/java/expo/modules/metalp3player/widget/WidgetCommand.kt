package expo.modules.metalp3player.widget

import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
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

  fun dispatch(ctx: Context, action: String) {
    main.post { runOnMain(ctx, action) }
  }

  private fun runOnMain(ctx: Context, action: String) {
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
          }
        } finally {
          controller.release()
        }
      }
      // The service's own Player.Listener publishes a new snapshot and triggers
      // a widget refresh; nothing else to do here.
    }, MoreExecutors.directExecutor())
  }
}
