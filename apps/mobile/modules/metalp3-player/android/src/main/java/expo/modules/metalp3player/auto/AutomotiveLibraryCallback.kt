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
 * The AA Coolwalk side widget queries [onGetLibraryRoot] with
 * [LibraryParams.isRecent] = true. We answer with a synthetic "recent" root
 * whose children are the latest-added albums, so the widget surfaces the
 * user's freshest sideloads as one-tap resume tiles.
 *
 * All MediaItems for tracks carry localConfiguration so [androidx.media3.exoplayer.ExoPlayer]
 * can play them once the controller calls setMediaItems/play.
 */
@OptIn(UnstableApi::class)
class AutomotiveLibraryCallback(private val context: Context) :
  MediaLibraryService.MediaLibrarySession.Callback {

  override fun onGetLibraryRoot(
    session: MediaLibraryService.MediaLibrarySession,
    browser: MediaSession.ControllerInfo,
    params: MediaLibraryService.LibraryParams?,
  ): ListenableFuture<LibraryResult<MediaItem>> {
    // AA's Coolwalk side widget calls onGetLibraryRoot with isRecent=true to
    // populate its "recent items" row. Returning the recent-albums category
    // as the root makes those tiles appear directly in the widget without
    // the user having to drill into the full browse tree.
    val root = if (params?.isRecent == true) recentCategoryItem() else rootItem()
    return Futures.immediateFuture(LibraryResult.ofItem(root, params))
  }

  override fun onGetItem(
    session: MediaLibraryService.MediaLibrarySession,
    browser: MediaSession.ControllerInfo,
    mediaId: String,
  ): ListenableFuture<LibraryResult<MediaItem>> {
    val item = resolveItem(mediaId)
      ?: return Futures.immediateFuture(LibraryResult.ofError(LibraryResult.RESULT_ERROR_BAD_VALUE))
    return Futures.immediateFuture(LibraryResult.ofItem(item, null))
  }

  override fun onGetChildren(
    session: MediaLibraryService.MediaLibrarySession,
    browser: MediaSession.ControllerInfo,
    parentId: String,
    page: Int,
    pageSize: Int,
    params: MediaLibraryService.LibraryParams?,
  ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
    val all = childrenOf(parentId)
      ?: return Futures.immediateFuture(LibraryResult.ofError(LibraryResult.RESULT_ERROR_BAD_VALUE))
    val from = page * pageSize
    val slice = if (from >= all.size) emptyList()
      else all.subList(from, minOf(from + pageSize, all.size))
    return Futures.immediateFuture(LibraryResult.ofItemList(ImmutableList.copyOf(slice), params))
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
    val resolved = mediaItems.mapNotNull { incoming ->
      val id = incoming.mediaId.takeIf { it.isNotBlank() } ?: return@mapNotNull null
      trackItemFor(id)
    }.toMutableList()
    return Futures.immediateFuture(resolved)
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
    val expanded = expandToAlbum(mediaItems, startIndex)
    return Futures.immediateFuture(
      MediaSession.MediaItemsWithStartPosition(
        expanded.items,
        expanded.startIndex,
        startPositionMs,
      )
    )
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

  // ---- tree building -------------------------------------------------------

  private fun rootItem(): MediaItem = browsable(Ids.ROOT, "Metal P3", null)

  private fun childrenOf(parentId: String): List<MediaItem>? = when {
    parentId == Ids.ROOT -> listOf(albumsCategoryItem(), playlistsCategoryItem())
    parentId == Ids.CAT_RECENT -> MediaStoreLibrary.listRecentAlbums(context).map { album ->
      browsable(
        id = Ids.album(album.id),
        title = album.title,
        subtitle = album.artist,
        artworkUri = MediaStoreLibrary.albumArtUri(album.id),
        mediaType = MediaMetadata.MEDIA_TYPE_ALBUM,
      )
    }
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
      MediaStoreLibrary.tracksForAlbum(context, albumId).map(::trackItem)
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
      pl.trackIds.mapNotNull { tid -> MediaStoreLibrary.trackById(context, tid) }.map(::trackItem)
    }
    else -> null
  }

  private fun resolveItem(mediaId: String): MediaItem? = when {
    mediaId == Ids.ROOT -> rootItem()
    mediaId == Ids.CAT_RECENT -> recentCategoryItem()
    mediaId == Ids.CAT_ALBUMS -> albumsCategoryItem()
    mediaId == Ids.CAT_PLAYLISTS -> playlistsCategoryItem()
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
   * Playlists browse root. The CATEGORY_LIST_ITEM hint tells AA to render
   * each playlist as a larger artwork-led row (single line of text, square
   * tile on the leading edge) rather than the default thumbnail-list row,
   * giving the album art more visual presence on the page.
   */
  private fun playlistsCategoryItem(): MediaItem = browsable(
    id = Ids.CAT_PLAYLISTS,
    title = "Playlists",
    subtitle = null,
    mediaType = MediaMetadata.MEDIA_TYPE_FOLDER_PLAYLISTS,
    extras = Bundle().apply {
      putInt(
        MediaConstants.EXTRAS_KEY_CONTENT_STYLE_BROWSABLE,
        MediaConstants.EXTRAS_VALUE_CONTENT_STYLE_CATEGORY_LIST_ITEM,
      )
    },
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

  /**
   * Recently-added albums in the same grid layout as the full Albums list,
   * but capped to the latest [MediaStoreLibrary.listRecentAlbums] entries
   * so the user sees their newest sideloads first without scrolling.
   */
  private fun recentCategoryItem(): MediaItem = browsable(
    id = Ids.CAT_RECENT,
    title = "Recently Added",
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
    const val CAT_RECENT = "metalp3:cat:recent"
    const val CAT_ALBUMS = "metalp3:cat:albums"
    const val CAT_PLAYLISTS = "metalp3:cat:playlists"
    const val ALBUM_PREFIX = "metalp3:album:"
    const val PLAYLIST_PREFIX = "metalp3:playlist:"
    const val TRACK_PREFIX = "metalp3:track:"
    fun album(id: Long) = "$ALBUM_PREFIX$id"
    fun playlist(id: String) = "$PLAYLIST_PREFIX$id"
    fun track(id: Long) = "$TRACK_PREFIX$id"
  }
}
