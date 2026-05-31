package expo.modules.metalp3player

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Shader
import android.media.MediaMetadataRetriever
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import androidx.palette.graphics.Palette
import expo.modules.metalp3player.auto.AutomotiveLibraryCallback
import expo.modules.metalp3player.widget.PlaybackService_BridgeSnapshot
import expo.modules.metalp3player.widget.WidgetRenderer
import expo.modules.metalp3player.widget.WidgetSnapshot
import java.util.concurrent.Executors

/**
 * Foreground media service hosting the ExoPlayer instance.
 *
 * Extending [MediaLibraryService] (rather than the simpler MediaSessionService)
 * is what lets Android Auto / Wear OS / Google Assistant browse the library.
 *
 * Bit-perfect / hi-res:
 * - No audio processors are added; default ExoPlayer renderer keeps the source PCM untouched.
 * - Audio attributes mark the stream as MUSIC (not voice) so Android picks the high-quality path.
 *
 * Audio offload is intentionally NOT enabled. media3 1.5.x's offload sleep
 * state can fail to wake on auto-advance (TRANSITION_REASON_AUTO), producing
 * silence on the next track until the user hits skip. The non-offload renderer
 * still does no resampling for local files, so bit-perfect is preserved.
 */
@OptIn(UnstableApi::class)
class PlaybackService : MediaLibraryService() {

  private companion object {
    const val TAG = "MetalP3Widget"
  }

  private lateinit var player: ExoPlayer
  private lateinit var librarySession: MediaLibrarySession
  private val artworkExecutor = Executors.newSingleThreadExecutor()
  @Volatile private var lastArtworkUri: String? = null

  override fun onCreate() {
    super.onCreate()

    val renderers = DefaultRenderersFactory(this)

    player = ExoPlayer.Builder(this, renderers)
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(C.USAGE_MEDIA)
          .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
          .build(),
        /* handleAudioFocus = */ true,
      )
      .setHandleAudioBecomingNoisy(true)
      .setWakeMode(C.WAKE_MODE_LOCAL)
      .build()

    librarySession = MediaLibrarySession
      .Builder(this, player, AutomotiveLibraryCallback(applicationContext))
      .build()

    player.addListener(object : Player.Listener {
      override fun onEvents(p: Player, events: Player.Events) {
        publishWidgetSnapshot()
      }

      override fun onPlaybackStateChanged(state: Int) {
        // When the queue runs out and we're not on repeat, rewind to the first
        // track and stay paused so the user sees the album poised to start over.
        if (state == Player.STATE_ENDED && player.repeatMode == Player.REPEAT_MODE_OFF && player.mediaItemCount > 0) {
          player.pause()
          player.seekTo(0, 0L)
        }
      }
    })
    publishWidgetSnapshot()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession =
    librarySession

  override fun onTaskRemoved(rootIntent: android.content.Intent?) {
    if (!player.playWhenReady || player.mediaItemCount == 0) stopSelf()
  }

  override fun onDestroy() {
    librarySession.release()
    player.release()
    artworkExecutor.shutdownNow()
    PlaybackService_BridgeSnapshot.publish(WidgetSnapshot.EMPTY)
    WidgetRenderer.renderAll(applicationContext)
    super.onDestroy()
  }

  // ---- widget integration --------------------------------------------------

  private fun publishWidgetSnapshot() {
    val item: MediaItem? = player.currentMediaItem
    val md = item?.mediaMetadata
    val title = md?.title?.toString()
    val artist = md?.artist?.toString() ?: md?.albumArtist?.toString()
    val album = md?.albumTitle?.toString()
    val sourceUri = item?.localConfiguration?.uri?.toString()
    val artworkUri = md?.artworkUri?.toString() ?: sourceUri
    // ExoPlayer extracts embedded artwork as part of normal playback metadata —
    // prefer those bytes over re-opening the file ourselves. setDataSource on
    // a content:// URI from the service's process can fail with status 0x80000000
    // even when JS-side reads of the same URI succeed, so we cache the artwork
    // payload alongside the URI to detect changes.
    val artworkBytes = md?.artworkData
    val hasQueue = player.mediaItemCount > 0
    val repeatMode = when (player.repeatMode) {
      Player.REPEAT_MODE_ONE -> "one"
      Player.REPEAT_MODE_ALL -> "all"
      else -> "off"
    }

    val keepArtwork = artworkUri != null && artworkUri == lastArtworkUri
    val prev = PlaybackService_BridgeSnapshot.read()

    PlaybackService_BridgeSnapshot.publish(
      WidgetSnapshot(
        title = title,
        artist = artist,
        album = album,
        isPlaying = player.isPlaying,
        hasQueue = hasQueue,
        artwork = if (keepArtwork) prev.artwork else null,
        artworkBlurred = if (keepArtwork) prev.artworkBlurred else null,
        queueIndex = if (hasQueue) player.currentMediaItemIndex else -1,
        queueCount = player.mediaItemCount,
        shuffle = player.shuffleModeEnabled,
        repeatMode = repeatMode,
        canSkipNext = hasQueue && player.hasNextMediaItem(),
        canSkipPrev = hasQueue && player.hasPreviousMediaItem(),
        foreground = if (keepArtwork) prev.foreground else WidgetSnapshot.EMPTY.foreground,
        mutedForeground = if (keepArtwork) prev.mutedForeground else WidgetSnapshot.EMPTY.mutedForeground,
        accent = if (keepArtwork) prev.accent else WidgetSnapshot.EMPTY.accent,
      )
    )
    WidgetRenderer.renderAll(applicationContext)

    if (artworkUri != null && artworkUri != lastArtworkUri) {
      lastArtworkUri = artworkUri
      loadArtworkAsync(artworkUri, artworkBytes, sourceUri)
    } else if (artworkUri == null) {
      lastArtworkUri = null
    }
  }

  private fun loadArtworkAsync(uri: String, embeddedBytes: ByteArray?, sourceUri: String?) {
    artworkExecutor.execute {
      val bmp = decodeArtworkBytes(embeddedBytes)
        ?: sourceUri?.let { decodeArtwork(it) }
      if (uri == lastArtworkUri) {
        val palette = bmp?.let { runCatching { Palette.from(it).generate() }.getOrNull() }
        val (fg, muted, accent) = pickPaletteColors(palette)
        // RemoteViews enforces a per-bitmap IPC budget; embedded album art is
        // typically 1500px+ and silently fails to inflate. Cap both copies.
        val widgetArt = bmp?.let { downsample(it, 192) }?.let { roundCorners(it, 18f) }
        val blurred = bmp?.let { downsample(it, 128) }
        val cur = PlaybackService_BridgeSnapshot.read()
        PlaybackService_BridgeSnapshot.publish(
          cur.copy(
            artwork = widgetArt,
            artworkBlurred = blurred,
            foreground = fg,
            mutedForeground = muted,
            accent = accent,
          )
        )
        WidgetRenderer.renderAll(applicationContext)
      }
    }
  }

  /**
   * RemoteViews drops bitmaps that:
   *   1. exceed its per-IPC budget (~roughly screen-size; album art is often 1500px+),
   *   2. use a hardware-backed config — they can't cross processes,
   *   3. use a non-ARGB config that the launcher can't render.
   *
   * To dodge all three we draw the source onto a fresh software ARGB_8888 canvas
   * at a known small size. Caller hands us already-decoded bytes so this stays
   * off the main thread.
   */
  private fun downsample(src: Bitmap, targetMaxEdge: Int): Bitmap? = try {
    val w = src.width
    val h = src.height
    if (w <= 0 || h <= 0) null else {
      val scale = (targetMaxEdge.toFloat() / maxOf(w, h)).coerceAtMost(1f)
      val nw = (w * scale).toInt().coerceAtLeast(1)
      val nh = (h * scale).toInt().coerceAtLeast(1)
      val out = Bitmap.createBitmap(nw, nh, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(out)
      val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
      canvas.drawBitmap(src, Rect(0, 0, w, h), Rect(0, 0, nw, nh), paint)
      Log.i(TAG, "downsample(${targetMaxEdge}) src=${w}x${h} -> out=${nw}x${nh}")
      out
    }
  } catch (t: Throwable) {
    Log.w(TAG, "downsample failed", t)
    null
  }

  /**
   * RemoteViews ImageViews can't be clipped by the launcher, so we bake the
   * rounded corners straight into the bitmap. `radiusDp` is interpreted in dp;
   * we convert to px against the source bitmap's native resolution so the
   * corner curve stays visually consistent regardless of widget cell size.
   */
  private fun roundCorners(src: Bitmap, radiusDp: Float): Bitmap {
    val density = resources.displayMetrics.density
    val radiusPx = radiusDp * density
    val out = Bitmap.createBitmap(src.width, src.height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(out)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      isFilterBitmap = true
      shader = BitmapShader(src, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
    }
    canvas.drawRoundRect(RectF(0f, 0f, src.width.toFloat(), src.height.toFloat()), radiusPx, radiusPx, paint)
    return out
  }

  /** Decode the artwork bytes ExoPlayer's metadata extractor already pulled out. */
  private fun decodeArtworkBytes(bytes: ByteArray?): Bitmap? {
    if (bytes == null || bytes.isEmpty()) return null
    return try {
      val opts = BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.ARGB_8888 }
      val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size, opts)
      Log.i(TAG, "decodeArtworkBytes: ${bytes.size}B -> bmp=${bmp?.width}x${bmp?.height}")
      bmp
    } catch (t: Throwable) {
      Log.w(TAG, "decodeArtworkBytes failed", t)
      null
    }
  }

  private fun decodeArtwork(uri: String): Bitmap? = try {
    val retriever = MediaMetadataRetriever()
    retriever.use {
      it.setDataSource(applicationContext, android.net.Uri.parse(uri))
      val pic = it.embeddedPicture
      if (pic == null) {
        Log.i(TAG, "decodeArtwork: no embedded picture for $uri")
        null
      } else {
        val opts = BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.ARGB_8888 }
        val bmp = BitmapFactory.decodeByteArray(pic, 0, pic.size, opts)
        Log.i(TAG, "decodeArtwork: ${pic.size}B -> bmp=${bmp?.width}x${bmp?.height}")
        bmp
      }
    }
  } catch (t: Throwable) {
    Log.w(TAG, "decodeArtwork(uri=$uri) failed: ${t.message}")
    null
  }

  /**
   * Pick a (foreground, mutedForeground, accent) triple for the widget that
   * stays legible against a dimmed-blurred copy of the same artwork. We bias
   * toward light text since the renderer applies a dark scrim.
   */
  private fun pickPaletteColors(palette: Palette?): Triple<Int, Int, Int> {
    if (palette == null) {
      return Triple(
        WidgetSnapshot.EMPTY.foreground,
        WidgetSnapshot.EMPTY.mutedForeground,
        WidgetSnapshot.EMPTY.accent,
      )
    }
    val accentRaw = palette.lightVibrantSwatch?.rgb
      ?: palette.vibrantSwatch?.rgb
      ?: palette.lightMutedSwatch?.rgb
      ?: palette.dominantSwatch?.rgb
      ?: WidgetSnapshot.EMPTY.accent
    val accent = lighten(accentRaw, 0.45f)
    val foreground = 0xFFFFFFFF.toInt()
    val muted = withAlpha(foreground, 0xCC)
    return Triple(foreground, muted, accent)
  }

  private fun lighten(color: Int, amount: Float): Int {
    val a = amount.coerceIn(0f, 1f)
    val r = (Color.red(color) + (255 - Color.red(color)) * a).toInt().coerceIn(0, 255)
    val g = (Color.green(color) + (255 - Color.green(color)) * a).toInt().coerceIn(0, 255)
    val b = (Color.blue(color) + (255 - Color.blue(color)) * a).toInt().coerceIn(0, 255)
    return Color.argb(0xFF, r, g, b)
  }

  private fun withAlpha(color: Int, alpha: Int): Int =
    (alpha and 0xFF shl 24) or (color and 0x00FFFFFF)
}
