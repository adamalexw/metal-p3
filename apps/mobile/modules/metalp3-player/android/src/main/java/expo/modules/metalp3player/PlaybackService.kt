package expo.modules.metalp3player

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionParameters
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
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
 * - Audio offload is requested so the SoC decoder/DAC bypasses the framework mixer when supported.
 * - No audio processors are added; default ExoPlayer renderer keeps the source PCM untouched.
 * - Audio attributes mark the stream as MUSIC (not voice) so Android picks the high-quality path.
 */
@OptIn(UnstableApi::class)
class PlaybackService : MediaLibraryService() {

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

    player.trackSelectionParameters = player.trackSelectionParameters
      .buildUpon()
      .setAudioOffloadPreferences(
        TrackSelectionParameters.AudioOffloadPreferences.Builder()
          .setAudioOffloadMode(
            TrackSelectionParameters.AudioOffloadPreferences.AUDIO_OFFLOAD_MODE_ENABLED
          )
          .setIsGaplessSupportRequired(true)
          .build()
      )
      .build()

    librarySession = MediaLibrarySession
      .Builder(this, player, AutomotiveLibraryCallback(applicationContext))
      .build()

    player.addListener(object : Player.Listener {
      override fun onEvents(p: Player, events: Player.Events) {
        publishWidgetSnapshot()
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
    val artworkUri = md?.artworkUri?.toString() ?: item?.localConfiguration?.uri?.toString()
    val hasQueue = player.mediaItemCount > 0

    PlaybackService_BridgeSnapshot.publish(
      WidgetSnapshot(
        title = title,
        artist = artist,
        isPlaying = player.isPlaying,
        hasQueue = hasQueue,
        artwork = PlaybackService_BridgeSnapshot.read().artwork
          .takeIf { artworkUri == lastArtworkUri },
      )
    )
    WidgetRenderer.renderAll(applicationContext)

    if (artworkUri != null && artworkUri != lastArtworkUri) {
      lastArtworkUri = artworkUri
      loadArtworkAsync(artworkUri)
    } else if (artworkUri == null) {
      lastArtworkUri = null
    }
  }

  private fun loadArtworkAsync(uri: String) {
    artworkExecutor.execute {
      val bmp = decodeArtwork(uri)
      if (uri == lastArtworkUri) {
        val cur = PlaybackService_BridgeSnapshot.read()
        PlaybackService_BridgeSnapshot.publish(cur.copy(artwork = bmp))
        WidgetRenderer.renderAll(applicationContext)
      }
    }
  }

  private fun decodeArtwork(uri: String): Bitmap? = try {
    val retriever = MediaMetadataRetriever()
    retriever.use {
      it.setDataSource(applicationContext, android.net.Uri.parse(uri))
      it.embeddedPicture?.let { bytes ->
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
      }
    }
  } catch (_: Throwable) {
    null
  }
}
