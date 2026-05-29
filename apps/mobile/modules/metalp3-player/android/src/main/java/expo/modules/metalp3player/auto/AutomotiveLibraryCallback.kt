package expo.modules.metalp3player.auto

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * MediaLibrarySession callback that exposes the on-device music library to
 * Android Auto, Google Assistant and Wear OS via the standard browse tree:
 *
 *   metalp3:root
 *     ├─ metalp3:cat:albums   →  metalp3:album:<id>   → metalp3:track:<id>
 *     ├─ metalp3:cat:artists  →  metalp3:artist:<id>  → metalp3:track:<id>
 *     └─ metalp3:cat:all      →  metalp3:track:<id>
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
  ): ListenableFuture<LibraryResult<MediaItem>> =
    Futures.immediateFuture(LibraryResult.ofItem(rootItem(), params))

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

  // ---- tree building -------------------------------------------------------

  private fun rootItem(): MediaItem = browsable(Ids.ROOT, "Metal P3", null)

  private fun childrenOf(parentId: String): List<MediaItem>? = when {
    parentId == Ids.ROOT -> listOf(
      browsable(Ids.CAT_ALBUMS, "Albums", null),
      browsable(Ids.CAT_ARTISTS, "Artists", null),
      browsable(Ids.CAT_ALL, "All Tracks", null),
    )
    parentId == Ids.CAT_ALBUMS -> MediaStoreLibrary.listAlbums(context).map { album ->
      browsable(
        id = Ids.album(album.id),
        title = album.title,
        subtitle = album.artist,
        artworkUri = MediaStoreLibrary.albumArtUri(album.id),
        mediaType = MediaMetadata.MEDIA_TYPE_ALBUM,
      )
    }
    parentId == Ids.CAT_ARTISTS -> MediaStoreLibrary.listArtists(context).map { artist ->
      browsable(
        id = Ids.artist(artist.id),
        title = artist.name,
        subtitle = null,
        mediaType = MediaMetadata.MEDIA_TYPE_ARTIST,
      )
    }
    parentId == Ids.CAT_ALL -> MediaStoreLibrary.listAllTracks(context).map(::trackItem)
    parentId.startsWith(Ids.ALBUM_PREFIX) -> {
      val albumId = parentId.removePrefix(Ids.ALBUM_PREFIX).toLongOrNull() ?: return null
      MediaStoreLibrary.tracksForAlbum(context, albumId).map(::trackItem)
    }
    parentId.startsWith(Ids.ARTIST_PREFIX) -> {
      val artistId = parentId.removePrefix(Ids.ARTIST_PREFIX).toLongOrNull() ?: return null
      MediaStoreLibrary.tracksForArtist(context, artistId).map(::trackItem)
    }
    else -> null
  }

  private fun resolveItem(mediaId: String): MediaItem? = when {
    mediaId == Ids.ROOT -> rootItem()
    mediaId == Ids.CAT_ALBUMS -> browsable(Ids.CAT_ALBUMS, "Albums", null)
    mediaId == Ids.CAT_ARTISTS -> browsable(Ids.CAT_ARTISTS, "Artists", null)
    mediaId == Ids.CAT_ALL -> browsable(Ids.CAT_ALL, "All Tracks", null)
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
    mediaId.startsWith(Ids.ARTIST_PREFIX) -> {
      val artistId = mediaId.removePrefix(Ids.ARTIST_PREFIX).toLongOrNull() ?: return null
      val artist = MediaStoreLibrary.listArtists(context).firstOrNull { it.id == artistId } ?: return null
      browsable(mediaId, artist.name, null, mediaType = MediaMetadata.MEDIA_TYPE_ARTIST)
    }
    else -> null
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
  ): MediaItem {
    val metadata = MediaMetadata.Builder()
      .setTitle(title)
      .setSubtitle(subtitle)
      .setArtworkUri(artworkUri)
      .setIsBrowsable(true)
      .setIsPlayable(false)
      .setMediaType(mediaType)
      .build()
    return MediaItem.Builder().setMediaId(id).setMediaMetadata(metadata).build()
  }

  private object Ids {
    const val ROOT = "metalp3:root"
    const val CAT_ALBUMS = "metalp3:cat:albums"
    const val CAT_ARTISTS = "metalp3:cat:artists"
    const val CAT_ALL = "metalp3:cat:all"
    const val ALBUM_PREFIX = "metalp3:album:"
    const val ARTIST_PREFIX = "metalp3:artist:"
    const val TRACK_PREFIX = "metalp3:track:"
    fun album(id: Long) = "$ALBUM_PREFIX$id"
    fun artist(id: Long) = "$ARTIST_PREFIX$id"
    fun track(id: Long) = "$TRACK_PREFIX$id"
  }
}
