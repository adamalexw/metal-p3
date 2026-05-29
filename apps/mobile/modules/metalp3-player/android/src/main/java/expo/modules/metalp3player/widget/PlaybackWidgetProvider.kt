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
  }

  override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    WidgetRenderer.render(ctx, mgr, ids)
  }

  override fun onReceive(ctx: Context, intent: Intent) {
    super.onReceive(ctx, intent)
    when (intent.action) {
      ACTION_PLAY_PAUSE, ACTION_NEXT, ACTION_PREV -> WidgetCommand.dispatch(ctx, intent.action!!)
    }
  }
}
