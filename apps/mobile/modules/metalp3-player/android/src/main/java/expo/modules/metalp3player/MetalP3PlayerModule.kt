package expo.modules.metalp3player

import android.content.ComponentName
import android.net.Uri
import android.os.Handler
import android.os.Looper
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.MoreExecutors
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MetalP3PlayerModule : Module() {

  private val mainHandler = Handler(Looper.getMainLooper())
  private var controller: MediaController? = null
  private var controllerFuture: ListenableFuture<MediaController>? = null

  private val playerListener = object : Player.Listener {
    override fun onEvents(player: Player, events: Player.Events) {
      emitState()
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MetalP3Player")
    Events("stateChanged")

    OnCreate { connect() }

    OnDestroy {
      runOnMain {
        controller?.removeListener(playerListener)
        controller?.release()
        controller = null
      }
      controllerFuture?.cancel(true)
      controllerFuture = null
    }

    AsyncFunction("setQueueAsync") { items: List<Map<String, Any?>>, startIndex: Int?, positionMs: Long? ->
      val mediaItems = items.map(::toMediaItem)
      withController { c ->
        c.setMediaItems(mediaItems, startIndex ?: 0, positionMs ?: 0L)
        c.prepare()
      }
    }

    AsyncFunction("addToQueueAsync") { items: List<Map<String, Any?>> ->
      val mediaItems = items.map(::toMediaItem)
      withController { c ->
        c.addMediaItems(mediaItems)
        if (c.playbackState == Player.STATE_IDLE) c.prepare()
      }
    }

    AsyncFunction("playAsync") { withController { it.play() } }
    AsyncFunction("pauseAsync") { withController { it.pause() } }
    AsyncFunction("stopAsync") { withController { it.stop() } }
    AsyncFunction("seekToAsync") { positionMs: Long -> withController { it.seekTo(positionMs) } }
    AsyncFunction("skipToNextAsync") { withController { it.seekToNextMediaItem() } }
    AsyncFunction("skipToPreviousAsync") { withController { it.seekToPreviousMediaItem() } }
    AsyncFunction("skipToIndexAsync") { index: Int ->
      withController {
        if (index in 0 until it.mediaItemCount) {
          it.seekTo(index, 0L)
          if (!it.isPlaying) it.play()
        }
      }
    }

    AsyncFunction("setRepeatModeAsync") { mode: String ->
      val repeat = when (mode) {
        "one" -> Player.REPEAT_MODE_ONE
        "all" -> Player.REPEAT_MODE_ALL
        else -> Player.REPEAT_MODE_OFF
      }
      withController { it.repeatMode = repeat }
    }

    AsyncFunction("setShuffleAsync") { on: Boolean ->
      withController { it.shuffleModeEnabled = on }
    }

    AsyncFunction("moveQueueItemAsync") { fromIndex: Int, toIndex: Int ->
      withController { it.moveMediaItem(fromIndex, toIndex) }
    }

    AsyncFunction("getStateAsync") {
      runOnMainBlocking { snapshotState() }
    }
  }

  private fun connect() {
    val ctx = appContext.reactContext ?: return
    val token = SessionToken(ctx, ComponentName(ctx, PlaybackService::class.java))
    val future = MediaController.Builder(ctx, token)
      .setApplicationLooper(Looper.getMainLooper())
      .buildAsync()
    controllerFuture = future
    future.addListener({
      try {
        val c = future.get()
        controller = c
        c.addListener(playerListener)
        emitState()
      } catch (_: Throwable) {
        // Service not yet startable; will reconnect on next OnCreate.
      }
    }, { mainHandler.post(it) })
  }

  private fun toMediaItem(item: Map<String, Any?>): MediaItem {
    val uri = (item["uri"] as? String)
      ?: throw CodedException("E_BAD_ITEM", "Queue item missing uri", null)
    val metadata = MediaMetadata.Builder()
      .setTitle(item["title"] as? String)
      .setArtist(item["artist"] as? String)
      .setAlbumTitle(item["album"] as? String)
      .setAlbumArtist(item["albumArtist"] as? String)
      .also { b ->
        (item["artworkUri"] as? String)?.let { b.setArtworkUri(Uri.parse(it)) }
      }
      .build()
    return MediaItem.Builder()
      .setMediaId(item["id"] as? String ?: uri)
      .setUri(uri)
      .setMediaMetadata(metadata)
      .build()
  }

  private fun snapshotState(): Map<String, Any?> {
    val c = controller ?: return mapOf(
      "ready" to false,
      "isPlaying" to false,
      "isLoading" to false,
      "currentIndex" to -1,
      "positionMs" to 0L,
      "durationMs" to 0L,
      "bufferedMs" to 0L,
      "playbackRate" to 1.0,
      "repeatMode" to "off",
      "shuffle" to false,
      "current" to null,
      "queue" to emptyList<Map<String, Any?>>(),
    )
    val md = c.mediaMetadata
    val queue = (0 until c.mediaItemCount).map { i ->
      val item = c.getMediaItemAt(i)
      val itemMd = item.mediaMetadata
      mapOf(
        "id" to item.mediaId,
        "uri" to item.localConfiguration?.uri?.toString(),
        "title" to itemMd.title?.toString(),
        "artist" to itemMd.artist?.toString(),
        "album" to itemMd.albumTitle?.toString(),
        "albumArtist" to itemMd.albumArtist?.toString(),
        "artworkUri" to itemMd.artworkUri?.toString(),
      )
    }
    return mapOf(
      "ready" to true,
      "isPlaying" to c.isPlaying,
      "isLoading" to (c.playbackState == Player.STATE_BUFFERING),
      "currentIndex" to c.currentMediaItemIndex,
      "positionMs" to c.currentPosition,
      "durationMs" to c.duration.coerceAtLeast(0L),
      "bufferedMs" to c.bufferedPosition,
      "playbackRate" to c.playbackParameters.speed.toDouble(),
      "repeatMode" to when (c.repeatMode) {
        Player.REPEAT_MODE_ONE -> "one"
        Player.REPEAT_MODE_ALL -> "all"
        else -> "off"
      },
      "shuffle" to c.shuffleModeEnabled,
      "current" to mapOf(
        "id" to c.currentMediaItem?.mediaId,
        "uri" to c.currentMediaItem?.localConfiguration?.uri?.toString(),
        "title" to md.title?.toString(),
        "artist" to md.artist?.toString(),
        "album" to md.albumTitle?.toString(),
        "albumArtist" to md.albumArtist?.toString(),
        "artworkUri" to md.artworkUri?.toString(),
      ),
      "queue" to queue,
    )
  }

  private fun emitState() {
    runOnMain { sendEvent("stateChanged", snapshotState()) }
  }

  private fun withController(block: (MediaController) -> Unit) {
    runOnMain {
      val c = controller ?: run { connect(); return@runOnMain }
      block(c)
    }
  }

  private fun runOnMain(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) block() else mainHandler.post(block)
  }

  private fun <T> runOnMainBlocking(block: () -> T): T {
    if (Looper.myLooper() == Looper.getMainLooper()) return block()
    val latch = java.util.concurrent.CountDownLatch(1)
    var result: T? = null
    var error: Throwable? = null
    mainHandler.post {
      try { result = block() } catch (t: Throwable) { error = t } finally { latch.countDown() }
    }
    latch.await()
    error?.let { throw it }
    @Suppress("UNCHECKED_CAST")
    return result as T
  }
}
