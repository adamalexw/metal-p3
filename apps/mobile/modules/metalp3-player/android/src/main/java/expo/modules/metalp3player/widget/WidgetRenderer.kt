package expo.modules.metalp3player.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Log
import android.widget.RemoteViews
import expo.modules.metalp3player.R
import java.io.File
import java.io.FileOutputStream

object WidgetRenderer {

  fun renderAll(ctx: Context) {
    val mgr = AppWidgetManager.getInstance(ctx)
    val ids = mgr.getAppWidgetIds(ComponentName(ctx, PlaybackWidgetProvider::class.java))
    if (ids.isNotEmpty()) render(ctx, mgr, ids)
  }

  fun render(ctx: Context, mgr: AppWidgetManager, ids: IntArray) {
    val views = build(ctx, PlaybackService_BridgeSnapshot.read(ctx))
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
      // No queue → show the app's splash icon as the artwork tile so the
      // widget reads as "Metal P3" rather than a generic music-note silhouette.
      // Once playback starts, the real artwork bitmap takes over.
      views.setImageViewResource(R.id.metalp3_widget_art, R.drawable.metalp3_widget_splash)
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
    views.setInt(R.id.metalp3_widget_play_pause, "setColorFilter", snap.foreground)
    val disabledColor = dim(snap.foreground, 0.3f)
    views.setInt(
      R.id.metalp3_widget_prev,
      "setColorFilter",
      if (snap.canSkipPrev) snap.foreground else disabledColor,
    )
    views.setInt(
      R.id.metalp3_widget_next,
      "setColorFilter",
      if (snap.canSkipNext) snap.foreground else disabledColor,
    )
    val shuffleColor = if (snap.shuffle) snap.accent else dim(snap.foreground, 0.55f)
    val repeatColor = if (snap.repeatMode != "off") snap.accent else dim(snap.foreground, 0.55f)
    views.setInt(R.id.metalp3_widget_shuffle, "setColorFilter", shuffleColor)
    views.setInt(R.id.metalp3_widget_repeat, "setColorFilter", repeatColor)

    val playPauseIntent =
      if (snap.hasQueue) broadcast(ctx, PlaybackWidgetProvider.ACTION_PLAY_PAUSE)
      else openAppIntent(ctx)

    views.setOnClickPendingIntent(R.id.metalp3_widget_play_pause, playPauseIntent)
    setTransportClick(
      views,
      R.id.metalp3_widget_prev,
      ctx,
      PlaybackWidgetProvider.ACTION_PREV,
      enabled = snap.canSkipPrev,
    )
    setTransportClick(
      views,
      R.id.metalp3_widget_next,
      ctx,
      PlaybackWidgetProvider.ACTION_NEXT,
      enabled = snap.canSkipNext,
    )
    // Older devices throw if the API isn't found; setBoolean has been on
    // ImageButton since API 1 (via View#setEnabled), so this is safe.
    views.setBoolean(R.id.metalp3_widget_prev, "setEnabled", snap.canSkipPrev)
    views.setBoolean(R.id.metalp3_widget_next, "setEnabled", snap.canSkipNext)

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

  /**
   * Wires the click target for a transport button. When [enabled] is false we
   * clear the pending intent so taps don't fire the action; the renderer also
   * dims the icon and calls setEnabled(false) on the view so launchers that
   * respect that flag will mark it un-pressable.
   */
  private fun setTransportClick(
    views: RemoteViews,
    viewId: Int,
    ctx: Context,
    action: String,
    enabled: Boolean,
  ) {
    if (enabled) {
      views.setOnClickPendingIntent(viewId, broadcast(ctx, action))
    } else {
      views.setOnClickPendingIntent(viewId, null)
    }
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
  @Volatile private var current: WidgetSnapshot? = null

  fun publish(snapshot: WidgetSnapshot, context: Context? = null) {
    current = snapshot
    if (context != null) {
      persist(context, snapshot)
    }
  }

  fun read(context: Context): WidgetSnapshot {
    var cur = current
    if (cur != null) return cur
    synchronized(this) {
      cur = current
      if (cur != null) return cur!!
      cur = load(context)
      current = cur
      return cur!!
    }
  }

  private fun persist(context: Context, snap: WidgetSnapshot) {
    try {
      val prefs = context.getSharedPreferences("metalp3_widget_snapshot", Context.MODE_PRIVATE)
      prefs.edit().apply {
        putString("title", snap.title)
        putString("artist", snap.artist)
        putString("album", snap.album)
        putBoolean("isPlaying", snap.isPlaying)
        putBoolean("hasQueue", snap.hasQueue)
        putInt("queueIndex", snap.queueIndex)
        putInt("queueCount", snap.queueCount)
        putBoolean("shuffle", snap.shuffle)
        putString("repeatMode", snap.repeatMode)
        putBoolean("canSkipNext", snap.canSkipNext)
        putBoolean("canSkipPrev", snap.canSkipPrev)
        putInt("foreground", snap.foreground)
        putInt("mutedForeground", snap.mutedForeground)
        putInt("accent", snap.accent)
      }.apply()

      saveBitmap(context, "widget_art.png", snap.artwork)
      saveBitmap(context, "widget_art_blurred.png", snap.artworkBlurred)
    } catch (e: Exception) {
      Log.w("MetalP3Widget", "Failed to persist widget snapshot", e)
    }
  }

  private fun load(context: Context): WidgetSnapshot {
    try {
      val prefs = context.getSharedPreferences("metalp3_widget_snapshot", Context.MODE_PRIVATE)
      if (!prefs.contains("hasQueue")) {
        return WidgetSnapshot.EMPTY
      }
      val title = prefs.getString("title", null)
      val artist = prefs.getString("artist", null)
      val album = prefs.getString("album", null)
      val isPlaying = prefs.getBoolean("isPlaying", false)
      val hasQueue = prefs.getBoolean("hasQueue", false)
      val queueIndex = prefs.getInt("queueIndex", -1)
      val queueCount = prefs.getInt("queueCount", 0)
      val shuffle = prefs.getBoolean("shuffle", false)
      val repeatMode = prefs.getString("repeatMode", "off") ?: "off"
      val canSkipNext = prefs.getBoolean("canSkipNext", false)
      val canSkipPrev = prefs.getBoolean("canSkipPrev", false)
      val foreground = prefs.getInt("foreground", WidgetSnapshot.EMPTY.foreground)
      val mutedForeground = prefs.getInt("mutedForeground", WidgetSnapshot.EMPTY.mutedForeground)
      val accent = prefs.getInt("accent", WidgetSnapshot.EMPTY.accent)

      val artwork = loadBitmap(context, "widget_art.png")
      val artworkBlurred = loadBitmap(context, "widget_art_blurred.png")

      return WidgetSnapshot(
        title = title,
        artist = artist,
        album = album,
        isPlaying = isPlaying,
        hasQueue = hasQueue,
        artwork = artwork,
        artworkBlurred = artworkBlurred,
        queueIndex = queueIndex,
        queueCount = queueCount,
        shuffle = shuffle,
        repeatMode = repeatMode,
        canSkipNext = canSkipNext,
        canSkipPrev = canSkipPrev,
        foreground = foreground,
        mutedForeground = mutedForeground,
        accent = accent,
      )
    } catch (e: Exception) {
      Log.w("MetalP3Widget", "Failed to load widget snapshot", e)
      return WidgetSnapshot.EMPTY
    }
  }

  private fun saveBitmap(context: Context, name: String, bmp: Bitmap?) {
    val file = File(context.cacheDir, name)
    if (bmp == null) {
      if (file.exists()) file.delete()
      return
    }
    try {
      FileOutputStream(file).use { out ->
        bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
      }
    } catch (e: Exception) {
      Log.w("MetalP3Widget", "Failed to save bitmap $name", e)
    }
  }

  private fun loadBitmap(context: Context, name: String): Bitmap? {
    val file = File(context.cacheDir, name)
    if (!file.exists()) return null
    return try {
      BitmapFactory.decodeFile(file.absolutePath)
    } catch (e: Exception) {
      Log.w("MetalP3Widget", "Failed to load bitmap $name", e)
      null
    }
  }
}
