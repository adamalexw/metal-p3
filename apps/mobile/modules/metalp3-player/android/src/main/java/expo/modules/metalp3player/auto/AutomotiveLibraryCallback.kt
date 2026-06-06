package expo.modules.metalp3player.auto

import android.content.Context
import android.net.Uri
import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaConstants
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import java.util.concurrent.Callable

/**
 * MediaLibrarySession callback that exposes the on-device music library to
 * Android Auto, Google Assistant and Wear OS via the browse tree:
 *
 *   metalp3:root
 *     ├─ metalp3:cat:albums     →  metalp3:album:<id>     → metalp3:track:<id>
 *     └─ metalp3:cat:playlists  →  metalp3:playlist:<id>  → metalp3:track:<id>
 *
 * Playlists live in JS (AsyncStorage) and are mirrored to native via
 * [PlaylistStore]; the JS layer pushes the playlist set on every mutation so
 * AA's synchronous browse callback can read them.
 *
 * All MediaItems for tracks carry localConfiguration so [androidx.media3.exoplayer.ExoPlayer]
 * can play them once the controller calls setMediaItems/play.
 */
@OptIn(UnstableApi::class)
class AutomotiveLibraryCallback(private val context: Context) :
  MediaLibraryService.MediaLibrarySession.Callback {

  private val queryExecutor = java.util.concurrent.Executors.newSingleThreadExecutor()

  override fun onGetLibraryRoot(
    session: MediaLibraryService.MediaLibrarySession,
    browser: MediaSession.ControllerInfo,
    params: MediaLibraryService.LibraryParams?,
  ): ListenableFuture<LibraryResult<MediaItem>> {
    return Futures.immediateFuture(LibraryResult.ofItem(rootItem(), params))
  }

  override fun onGetItem(
    session: MediaLibraryService.MediaLibrarySession,
    browser: MediaSession.ControllerInfo,
    mediaId: String,
  ): ListenableFuture<LibraryResult<MediaItem>> {
    return Futures.submit(Callable {
      val item = resolveItem(mediaId)
      if (item != null) {
        LibraryResult.ofItem(item, null)
      } else {
        LibraryResult.ofError(LibraryResult.RESULT_ERROR_BAD_VALUE)
      }
    }, queryExecutor)
  }

  override fun onGetChildren(
    session: MediaLibraryService.MediaLibrarySession,
    browser: MediaSession.ControllerInfo,
    parentId: String,
    page: Int,
    pageSize: Int,
    params: MediaLibraryService.LibraryParams?,
  ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
    return Futures.submit(Callable {
      val all = childrenOf(parentId)
      if (all == null) {
        LibraryResult.ofError(LibraryResult.RESULT_ERROR_BAD_VALUE)
      } else {
        val from = page * pageSize
        val slice = if (from >= all.size) emptyList()
          else all.subList(from, minOf(from + pageSize, all.size))
        LibraryResult.ofItemList(ImmutableList.copyOf(slice), params)
      }
    }, queryExecutor)
  }

  /**
   * Auto sends back items containing only mediaId — rehydrate localConfiguration
   * so ExoPlayer knows what URI to stream.
   */
  override fun onAddMediaItems(
    session: MediaSession,
    controller: MediaSession.ControllerInfo,
    mediaItems: MutableList<MediaItem>,
  ): ListenableFuture<MutableList<MediaItem>> {
    return Futures.submit(Callable {
      val resolved = mediaItems.flatMap { incoming ->
        val id = incoming.mediaId.takeIf { it.isNotBlank() } ?: return@flatMap emptyList()
        // A "Shuffle" row expands to the whole album/playlist in random order;
        // a normal row resolves to its single track.
        shuffledQueueFor(id) ?: listOfNotNull(trackItemFor(id))
      }.toMutableList()
      resolved
    }, queryExecutor)
  }

  /**
   * When the user taps a single track in an album browse view, AA only sends
   * that one track. Expand the queue to the full album starting at the tapped
   * track so the rest of the album plays through.
   */
  override fun onSetMediaItems(
    mediaSession: MediaSession,
    controller: MediaSession.ControllerInfo,
    mediaItems: MutableList<MediaItem>,
    startIndex: Int,
    startPositionMs: Long,
  ): ListenableFuture<MediaSession.MediaItemsWithStartPosition> {
    return Futures.submit(Callable {
      val expanded = expandToAlbum(mediaItems, startIndex)
      MediaSession.MediaItemsWithStartPosition(
        expanded.items,
        expanded.startIndex,
        startPositionMs,
      )
    }, queryExecutor)
  }

  private data class Expansion(val items: MutableList<MediaItem>, val startIndex: Int)

  private fun expandToAlbum(incoming: MutableList<MediaItem>, requestedStartIndex: Int): Expansion {
    if (incoming.size != 1) {
      // Multiple items — caller already supplied a queue, just rehydrate URIs.
      val rehydrated = incoming.mapNotNull { trackItemFor(it.mediaId) }.toMutableList()
      val safeIndex = requestedStartIndex.coerceIn(0, (rehydrated.size - 1).coerceAtLeast(0))
      return Expansion(rehydrated, safeIndex)
    }
    val tappedId = incoming[0].mediaId
    // Tapping a "Shuffle" row builds the full album/playlist queue in random
    // order and starts at the top. ExoPlayer plays this pre-shuffled list in
    // place, so no shuffle-mode flag is needed on the session.
    shuffledQueueFor(tappedId)?.let { shuffled ->
      if (shuffled.isNotEmpty()) return Expansion(shuffled.toMutableList(), 0)
    }
    val trackId = tappedId.removePrefix(Ids.TRACK_PREFIX).toLongOrNull()
      ?: return Expansion(mutableListOf(trackItemFor(tappedId) ?: incoming[0]), 0)
    val track = MediaStoreLibrary.trackById(context, trackId)
      ?: return Expansion(mutableListOf(trackItemFor(tappedId) ?: incoming[0]), 0)
    val albumTracks = MediaStoreLibrary.tracksForAlbum(context, track.albumId)
    if (albumTracks.isEmpty()) {
      return Expansion(mutableListOf(trackItem(track)), 0)
    }
    val items = albumTracks.map(::trackItem).toMutableList()
    val idx = albumTracks.indexOfFirst { it.id == track.id }.coerceAtLeast(0)
    return Expansion(items, idx)
  }

  /**
   * If [mediaId] is a "Shuffle" row, return the album/playlist's tracks in a
   * random order ready to enqueue; null for any other id.
   */
  private fun shuffledQueueFor(mediaId: String): List<MediaItem>? = when {
    mediaId.startsWith(Ids.SHUFFLE_ALBUM_PREFIX) -> {
      val albumId = mediaId.removePrefix(Ids.SHUFFLE_ALBUM_PREFIX).toLongOrNull() ?: return null
      MediaStoreLibrary.tracksForAlbum(context, albumId).shuffled().map(::trackItem)
    }
    mediaId.startsWith(Ids.SHUFFLE_PLAYLIST_PREFIX) -> {
      val pid = mediaId.removePrefix(Ids.SHUFFLE_PLAYLIST_PREFIX)
      val pl = PlaylistStore.byId(context, pid) ?: return null
      pl.trackIds.mapNotNull { tid -> MediaStoreLibrary.trackById(context, tid) }
        .shuffled().map(::trackItem)
    }
    else -> null
  }

  // ---- tree building -------------------------------------------------------

  private fun rootItem(): MediaItem = browsable(Ids.ROOT, "Metal P3", null)

  private fun childrenOf(parentId: String): List<MediaItem>? = when {
    parentId == Ids.ROOT -> listOf(albumsCategoryItem(), playlistsCategoryItem())
    parentId == Ids.CAT_ALBUMS -> MediaStoreLibrary.listAlbums(context).map { album ->
      browsable(
        id = Ids.album(album.id),
        title = album.title,
        subtitle = album.artist,
        artworkUri = MediaStoreLibrary.albumArtUri(album.id),
        mediaType = MediaMetadata.MEDIA_TYPE_ALBUM,
      )
    }
    parentId.startsWith(Ids.ALBUM_PREFIX) -> {
      val albumId = parentId.removePrefix(Ids.ALBUM_PREFIX).toLongOrNull() ?: return null
      val tracks = MediaStoreLibrary.tracksForAlbum(context, albumId)
      if (tracks.isEmpty()) emptyList()
      else listOf(shuffleItem(Ids.shuffleAlbum(albumId), tracks.first())) + tracks.map(::trackItem)
    }
    parentId == Ids.CAT_PLAYLISTS -> PlaylistStore.list(context).map { pl ->
      browsable(
        id = Ids.playlist(pl.id),
        title = pl.name,
        subtitle = trackCountSubtitle(pl.trackIds.size),
        artworkUri = playlistArtworkUri(pl),
        mediaType = MediaMetadata.MEDIA_TYPE_PLAYLIST,
      )
    }
    parentId.startsWith(Ids.PLAYLIST_PREFIX) -> {
      val pid = parentId.removePrefix(Ids.PLAYLIST_PREFIX)
      val pl = PlaylistStore.byId(context, pid) ?: return emptyList()
      val tracks = pl.trackIds.mapNotNull { tid -> MediaStoreLibrary.trackById(context, tid) }
      if (tracks.isEmpty()) emptyList()
      else listOf(shuffleItem(Ids.shufflePlaylist(pid), tracks.first())) + tracks.map(::trackItem)
    }
    else -> null
  }

  private fun resolveItem(mediaId: String): MediaItem? = when {
    mediaId == Ids.ROOT -> rootItem()
    mediaId == Ids.CAT_ALBUMS -> albumsCategoryItem()
    mediaId == Ids.CAT_PLAYLISTS -> playlistsCategoryItem()
    mediaId.startsWith(Ids.SHUFFLE_ALBUM_PREFIX) -> {
      val albumId = mediaId.removePrefix(Ids.SHUFFLE_ALBUM_PREFIX).toLongOrNull() ?: return null
      val first = MediaStoreLibrary.tracksForAlbum(context, albumId).firstOrNull() ?: return null
      shuffleItem(mediaId, first)
    }
    mediaId.startsWith(Ids.SHUFFLE_PLAYLIST_PREFIX) -> {
      val pid = mediaId.removePrefix(Ids.SHUFFLE_PLAYLIST_PREFIX)
      val pl = PlaylistStore.byId(context, pid) ?: return null
      val first = pl.trackIds.firstNotNullOfOrNull { tid -> MediaStoreLibrary.trackById(context, tid) }
        ?: return null
      shuffleItem(mediaId, first)
    }
    mediaId.startsWith(Ids.TRACK_PREFIX) -> trackItemFor(mediaId)
    mediaId.startsWith(Ids.ALBUM_PREFIX) -> {
      val albumId = mediaId.removePrefix(Ids.ALBUM_PREFIX).toLongOrNull() ?: return null
      val album = MediaStoreLibrary.listAlbums(context).firstOrNull { it.id == albumId } ?: return null
      browsable(
        id = mediaId,
        title = album.title,
        subtitle = album.artist,
        artworkUri = MediaStoreLibrary.albumArtUri(album.id),
        mediaType = MediaMetadata.MEDIA_TYPE_ALBUM,
      )
    }
    mediaId.startsWith(Ids.PLAYLIST_PREFIX) -> {
      val pid = mediaId.removePrefix(Ids.PLAYLIST_PREFIX)
      val pl = PlaylistStore.byId(context, pid) ?: return null
      browsable(
        id = mediaId,
        title = pl.name,
        subtitle = trackCountSubtitle(pl.trackIds.size),
        artworkUri = playlistArtworkUri(pl),
        mediaType = MediaMetadata.MEDIA_TYPE_PLAYLIST,
      )
    }
    else -> null
  }

  /**
   * Playlists browse root. Uses the same grid content-style as Albums so each
   * playlist renders as a 2-column artwork tile with a title/subtitle caption,
   * matching the Library / Albums browse layout.
   */
  private fun playlistsCategoryItem(): MediaItem = browsable(
    id = Ids.CAT_PLAYLISTS,
    title = "Playlists",
    subtitle = null,
    mediaType = MediaMetadata.MEDIA_TYPE_FOLDER_PLAYLISTS,
    extras = gridStyleExtras(),
  )

  /** Use the artwork of the first resolvable track as the playlist tile. */
  private fun playlistArtworkUri(pl: PlaylistStore.Entry): Uri? {
    val firstTrackId = pl.trackIds.firstOrNull() ?: return null
    val track = MediaStoreLibrary.trackById(context, firstTrackId) ?: return null
    return MediaStoreLibrary.albumArtUri(track.albumId)
  }

  private fun trackCountSubtitle(count: Int): String = when (count) {
    0 -> "Empty"
    1 -> "1 track"
    else -> "$count tracks"
  }

  /**
   * Albums browse root. The grid content-style hint tells AA to render its
   * children (the album list) as a 2-column grid of artwork tiles with the
   * title/subtitle rendered as a caption underneath each tile.
   */
  private fun albumsCategoryItem(): MediaItem = browsable(
    id = Ids.CAT_ALBUMS,
    title = "Albums",
    subtitle = null,
    extras = gridStyleExtras(),
  )

  private fun gridStyleExtras(): Bundle = Bundle().apply {
    putInt(
      MediaConstants.EXTRAS_KEY_CONTENT_STYLE_BROWSABLE,
      MediaConstants.EXTRAS_VALUE_CONTENT_STYLE_GRID_ITEM,
    )
    putInt(
      MediaConstants.EXTRAS_KEY_CONTENT_STYLE_PLAYABLE,
      MediaConstants.EXTRAS_VALUE_CONTENT_STYLE_LIST_ITEM,
    )
  }

  private fun trackItemFor(mediaId: String): MediaItem? {
    val trackId = mediaId.removePrefix(Ids.TRACK_PREFIX).toLongOrNull() ?: return null
    val track = MediaStoreLibrary.trackById(context, trackId) ?: return null
    return trackItem(track)
  }

  /**
   * A playable "Shuffle" row pinned to the top of an album/playlist track list.
   * Tapping it routes through [shuffledQueueFor] (via onAddMediaItems /
   * onSetMediaItems), which expands [shuffleId] into the full shuffled queue.
   * Reuses the first track's artwork so the row reads as part of the set.
   */
  private fun shuffleItem(shuffleId: String, representative: MediaStoreLibrary.Track): MediaItem {
    val metadata = MediaMetadata.Builder()
      .setTitle("Shuffle")
      .setArtworkUri(MediaStoreLibrary.albumArtUri(representative.albumId))
      .setIsBrowsable(false)
      .setIsPlayable(true)
      .setMediaType(MediaMetadata.MEDIA_TYPE_MUSIC)
      .build()
    return MediaItem.Builder().setMediaId(shuffleId).setMediaMetadata(metadata).build()
  }

  private fun trackItem(track: MediaStoreLibrary.Track): MediaItem {
    val metadata = MediaMetadata.Builder()
      .setTitle(track.title)
      .setArtist(track.artist)
      .setAlbumTitle(track.album)
      .setArtworkUri(MediaStoreLibrary.albumArtUri(track.albumId))
      .setIsBrowsable(false)
      .setIsPlayable(true)
      .setMediaType(MediaMetadata.MEDIA_TYPE_MUSIC)
      .setDurationMs(track.durationMs)
      .build()
    return MediaItem.Builder()
      .setMediaId(Ids.track(track.id))
      .setUri(track.uri)
      .setMediaMetadata(metadata)
      .build()
  }

  private fun browsable(
    id: String,
    title: String,
    subtitle: String?,
    artworkUri: Uri? = null,
    mediaType: Int = MediaMetadata.MEDIA_TYPE_FOLDER_MIXED,
    extras: Bundle? = null,
  ): MediaItem {
    val metadata = MediaMetadata.Builder()
      .setTitle(title)
      .setSubtitle(subtitle)
      // setArtist drives the second-line text in AA's list/grid layouts.
      // setSubtitle alone is ignored by the in-car renderer.
      .setArtist(subtitle)
      .setArtworkUri(artworkUri)
      .setIsBrowsable(true)
      .setIsPlayable(false)
      .setMediaType(mediaType)
      .apply { if (extras != null) setExtras(extras) }
      .build()
    return MediaItem.Builder().setMediaId(id).setMediaMetadata(metadata).build()
  }

  private object Ids {
    const val ROOT = "metalp3:root"
    const val CAT_ALBUMS = "metalp3:cat:albums"
    const val CAT_PLAYLISTS = "metalp3:cat:playlists"
    const val ALBUM_PREFIX = "metalp3:album:"
    const val PLAYLIST_PREFIX = "metalp3:playlist:"
    const val TRACK_PREFIX = "metalp3:track:"
    const val SHUFFLE_ALBUM_PREFIX = "metalp3:shuffle:album:"
    const val SHUFFLE_PLAYLIST_PREFIX = "metalp3:shuffle:playlist:"
    fun album(id: Long) = "$ALBUM_PREFIX$id"
    fun playlist(id: String) = "$PLAYLIST_PREFIX$id"
    fun track(id: Long) = "$TRACK_PREFIX$id"
    fun shuffleAlbum(id: Long) = "$SHUFFLE_ALBUM_PREFIX$id"
    fun shufflePlaylist(id: String) = "$SHUFFLE_PLAYLIST_PREFIX$id"
  }
}
