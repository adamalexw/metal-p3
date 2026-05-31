package expo.modules.metalp3player.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

class PlaybackWidgetProvider : AppWidgetProvider() {

  companion object {
    const val ACTION_PLAY_PAUSE = "expo.modules.metalp3player.widget.PLAY_PAUSE"
    const val ACTION_NEXT = "expo.modules.metalp3player.widget.NEXT"
    const val ACTION_PREV = "expo.modules.metalp3player.widget.PREV"
    const val ACTION_SHUFFLE = "expo.modules.metalp3player.widget.SHUFFLE"
    const val ACTION_REPEAT = "expo.modules.metalp3player.widget.REPEAT"
  }

  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    WidgetRenderer.render(ctx, mgr, ids)
  }

  override fun onReceive(ctx: Context, intent: Intent) {
    super.onReceive(ctx, intent)
    val action = intent.action
    if (action == ACTION_PLAY_PAUSE ||
        action == ACTION_NEXT ||
        action == ACTION_PREV ||
        action == ACTION_SHUFFLE ||
        action == ACTION_REPEAT) {
      // goAsync() keeps the broadcast alive for up to ~10s while the async
      // MediaController connects. Without it the receiver returns immediately
      // and the OS can kill the process before our command lands.
      val pending = goAsync()
      WidgetCommand.dispatch(ctx.applicationContext, action) { pending.finish() }
    }
  }
}
