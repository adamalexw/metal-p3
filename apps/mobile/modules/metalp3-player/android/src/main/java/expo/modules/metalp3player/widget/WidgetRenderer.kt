package expo.modules.metalp3player.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.util.Log
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
    Log.i(
      "MetalP3Widget",
      "render title=${snap.title} art=${snap.artwork?.width}x${snap.artwork?.height} " +
        "bg=${snap.artworkBlurred?.width}x${snap.artworkBlurred?.height} " +
        "config=${snap.artwork?.config}",
    )

    val title = snap.title ?: ctx.getString(R.string.metalp3_widget_idle)
    views.setTextViewText(R.id.metalp3_widget_title, title)
    views.setTextColor(R.id.metalp3_widget_title, snap.foreground)

    views.setTextViewText(
      R.id.metalp3_widget_subtitle,
      buildSubtitle(ctx, snap),
    )
    views.setTextColor(R.id.metalp3_widget_subtitle, snap.mutedForeground)

    if (snap.artwork != null) {
      views.setImageViewBitmap(R.id.metalp3_widget_art, snap.artwork)
    } else {
      views.setImageViewResource(R.id.metalp3_widget_art, R.drawable.metalp3_widget_ic_note)
    }

    if (snap.artworkBlurred != null) {
      views.setImageViewBitmap(R.id.metalp3_widget_bg, snap.artworkBlurred)
    } else {
      views.setImageViewResource(R.id.metalp3_widget_bg, R.drawable.metalp3_widget_bg_transparent)
    }

    views.setImageViewResource(
      R.id.metalp3_widget_play_pause,
      if (snap.isPlaying) R.drawable.metalp3_widget_ic_pause else R.drawable.metalp3_widget_ic_play,
    )
    views.setImageViewResource(
      R.id.metalp3_widget_repeat,
      if (snap.repeatMode == "one") R.drawable.metalp3_widget_ic_repeat_one
      else R.drawable.metalp3_widget_ic_repeat,
    )

    // Tint transport icons by reflecting setColorFilter(Int) on the ImageButton.
    // RemoteViews has supported the int form since API 1.
    val foregroundButtons = intArrayOf(
      R.id.metalp3_widget_prev,
      R.id.metalp3_widget_next,
      R.id.metalp3_widget_play_pause,
    )
    for (id in foregroundButtons) {
      views.setInt(id, "setColorFilter", snap.foreground)
    }
    val shuffleColor = if (snap.shuffle) snap.accent else dim(snap.foreground, 0.55f)
    val repeatColor = if (snap.repeatMode != "off") snap.accent else dim(snap.foreground, 0.55f)
    views.setInt(R.id.metalp3_widget_shuffle, "setColorFilter", shuffleColor)
    views.setInt(R.id.metalp3_widget_repeat, "setColorFilter", repeatColor)

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
    views.setOnClickPendingIntent(
      R.id.metalp3_widget_shuffle,
      broadcast(ctx, PlaybackWidgetProvider.ACTION_SHUFFLE),
    )
    views.setOnClickPendingIntent(
      R.id.metalp3_widget_repeat,
      broadcast(ctx, PlaybackWidgetProvider.ACTION_REPEAT),
    )
    views.setOnClickPendingIntent(R.id.metalp3_widget_art, openAppIntent(ctx))
    views.setOnClickPendingIntent(R.id.metalp3_widget_title, openAppIntent(ctx))
    views.setOnClickPendingIntent(R.id.metalp3_widget_subtitle, openAppIntent(ctx))

    return views
  }

  /** "Band · 3/12" — empty parts are dropped without dangling separators. */
  private fun buildSubtitle(ctx: Context, snap: WidgetSnapshot): CharSequence {
    val counter = if (snap.queueCount > 0 && snap.queueIndex >= 0)
      "${snap.queueIndex + 1}/${snap.queueCount}" else null
    val parts = listOfNotNull(snap.artist, counter)
    if (parts.isEmpty()) return ctx.getString(R.string.metalp3_widget_tap_to_open)
    return parts.joinToString(" · ")
  }

  private fun dim(color: Int, factor: Float): Int {
    val a = factor.coerceIn(0f, 1f)
    val r = (Color.red(color) * a).toInt().coerceIn(0, 255)
    val g = (Color.green(color) * a).toInt().coerceIn(0, 255)
    val b = (Color.blue(color) * a).toInt().coerceIn(0, 255)
    return Color.argb(Color.alpha(color), r, g, b)
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
