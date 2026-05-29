package expo.modules.metalp3player.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import expo.modules.metalp3player.R

object WidgetRenderer {

  fun renderAll(ctx: Context) {
    val mgr = AppWidgetManager.getInstance(ctx)
    val ids = mgr.getAppWidgetIds(ComponentName(ctx, PlaybackWidgetProvider::class.java))
    if (ids.isNotEmpty()) render(ctx, mgr, ids)
  }

  fun render(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val views = build(ctx, PlaybackService_BridgeSnapshot.read())
    for (id in ids) mgr.updateAppWidget(id, views)
  }

  private fun build(ctx: Context, snap: WidgetSnapshot): RemoteViews {
    val views = RemoteViews(ctx.packageName, R.layout.metalp3_playback_widget)

    views.setTextViewText(
      R.id.metalp3_widget_title,
      snap.title ?: ctx.getString(R.string.metalp3_widget_idle),
    )
    views.setTextViewText(
      R.id.metalp3_widget_subtitle,
      snap.artist ?: ctx.getString(R.string.metalp3_widget_tap_to_open),
    )

    if (snap.artwork != null) {
      views.setImageViewBitmap(R.id.metalp3_widget_art, snap.artwork)
    } else {
      views.setImageViewResource(R.id.metalp3_widget_art, R.drawable.metalp3_widget_ic_note)
    }

    views.setImageViewResource(
      R.id.metalp3_widget_play_pause,
      if (snap.isPlaying) R.drawable.metalp3_widget_ic_pause else R.drawable.metalp3_widget_ic_play,
    )

    val playPauseIntent =
      if (snap.hasQueue) broadcast(ctx, PlaybackWidgetProvider.ACTION_PLAY_PAUSE)
      else openAppIntent(ctx)

    views.setOnClickPendingIntent(R.id.metalp3_widget_play_pause, playPauseIntent)
    views.setOnClickPendingIntent(
      R.id.metalp3_widget_prev,
      broadcast(ctx, PlaybackWidgetProvider.ACTION_PREV),
    )
    views.setOnClickPendingIntent(
      R.id.metalp3_widget_next,
      broadcast(ctx, PlaybackWidgetProvider.ACTION_NEXT),
    )
    views.setOnClickPendingIntent(R.id.metalp3_widget_art, openAppIntent(ctx))
    views.setOnClickPendingIntent(R.id.metalp3_widget_title, openAppIntent(ctx))
    views.setOnClickPendingIntent(R.id.metalp3_widget_subtitle, openAppIntent(ctx))

    return views
  }

  private fun broadcast(ctx: Context, action: String): PendingIntent {
    val intent = Intent(ctx, PlaybackWidgetProvider::class.java).setAction(action)
    return PendingIntent.getBroadcast(
      ctx,
      action.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun openAppIntent(ctx: Context): PendingIntent {
    val launch = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)
      ?: Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    return PendingIntent.getActivity(
      ctx,
      0,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }
}

/**
 * Indirection so widget code never depends on the service class directly
 * (avoids accidentally bringing the service into memory just to read state).
 */
internal object PlaybackService_BridgeSnapshot {
  @Volatile private var current: WidgetSnapshot = WidgetSnapshot.EMPTY
  fun publish(snapshot: WidgetSnapshot) { current = snapshot }
  fun read(): WidgetSnapshot = current
}
