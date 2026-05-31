package expo.modules.metalp3player.auto

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore

/**
 * Thin MediaStore facade used by Android Auto / Wear OS / Assistant browse.
 *
 * The Auto surface is a one-shot reader: we don't cache anything here so that
 * a freshly side-loaded album shows up the next time the head unit asks.
 */
internal object MediaStoreLibrary {

  data class Album(val id: Long, val title: String, val artist: String?)
  data class Artist(val id: Long, val name: String)
  data class Track(
    val id: Long,
    val title: String,
    val artist: String?,
    val album: String?,
    val albumId: Long,
    val uri: Uri,
    val durationMs: Long,
  )

  fun listAlbums(ctx: Context): List<Album> {
    val cols = arrayOf(
      MediaStore.Audio.Albums._ID,
      MediaStore.Audio.Albums.ALBUM,
      MediaStore.Audio.Albums.ARTIST,
    )
    return query(ctx, MediaStore.Audio.Albums.EXTERNAL_CONTENT_URI, cols, null, null, "${MediaStore.Audio.Albums.ALBUM} COLLATE NOCASE ASC") { c ->
      Album(c.getLong(0), c.getString(1) ?: "Unknown album", c.getString(2))
    }
  }

  /**
   * Returns up to [limit] albums in descending order of DATE_ADDED. The
   * Albums collection itself doesn't expose DATE_ADDED, so we walk the
   * Audio.Media collection in date order and dedupe by album_id — the
   * first time we see an album_id is its newest track's date.
   */
  fun listRecentAlbums(ctx: Context, limit: Int = 24): List<Album> {
    val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
      MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL) else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    val cols = mutableListOf(
      MediaStore.Audio.Media.ALBUM_ID,
      MediaStore.Audio.Media.ALBUM,
      MediaStore.Audio.Media.ARTIST,
      MediaStore.Audio.Media.DATE_ADDED,
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      cols += MediaStore.Audio.Media.ALBUM_ARTIST
    }
    val seen = HashSet<Long>()
    val out = ArrayList<Album>(limit)
    ctx.contentResolver.query(
      collection,
      cols.toTypedArray(),
      "${MediaStore.Audio.Media.IS_MUSIC}=1",
      null,
      "${MediaStore.Audio.Media.DATE_ADDED} DESC",
    )?.use { c ->
      val albumArtistIdx = c.getColumnIndex("album_artist")
      while (c.moveToNext() && out.size < limit) {
        val albumId = c.getLong(0)
        if (!seen.add(albumId)) continue
        val albumArtist = if (albumArtistIdx >= 0) c.getString(albumArtistIdx) else null
        out += Album(
          id = albumId,
          title = c.getString(1) ?: "Unknown album",
          artist = albumArtist ?: c.getString(2),
        )
      }
    }
    return out
  }

  fun listArtists(ctx: Context): List<Artist> {
    val cols = arrayOf(MediaStore.Audio.Artists._ID, MediaStore.Audio.Artists.ARTIST)
    return query(ctx, MediaStore.Audio.Artists.EXTERNAL_CONTENT_URI, cols, null, null, "${MediaStore.Audio.Artists.ARTIST} COLLATE NOCASE ASC") { c ->
      Artist(c.getLong(0), c.getString(1) ?: "Unknown artist")
    }
  }

  fun listAllTracks(ctx: Context, limit: Int = 500): List<Track> = queryTracks(
    ctx,
    selection = "${MediaStore.Audio.Media.IS_MUSIC}=1",
    args = null,
    sort = "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC",
    limit = limit,
  )

  fun tracksForAlbum(ctx: Context, albumId: Long): List<Track> = queryTracks(
    ctx,
    selection = "${MediaStore.Audio.Media.ALBUM_ID}=? AND ${MediaStore.Audio.Media.IS_MUSIC}=1",
    args = arrayOf(albumId.toString()),
    sort = "${MediaStore.Audio.Media.TRACK} ASC, ${MediaStore.Audio.Media.TITLE} COLLATE NOCASE ASC",
  )

  fun tracksForArtist(ctx: Context, artistId: Long): List<Track> = queryTracks(
    ctx,
    selection = "${MediaStore.Audio.Media.ARTIST_ID}=? AND ${MediaStore.Audio.Media.IS_MUSIC}=1",
    args = arrayOf(artistId.toString()),
    sort = "${MediaStore.Audio.Media.ALBUM} COLLATE NOCASE ASC, ${MediaStore.Audio.Media.TRACK} ASC",
  )

  fun trackById(ctx: Context, trackId: Long): Track? {
    val list = queryTracks(
      ctx,
      selection = "${MediaStore.Audio.Media._ID}=?",
      args = arrayOf(trackId.toString()),
      sort = null,
    )
    return list.firstOrNull()
  }

  fun albumArtUri(albumId: Long): Uri =
    ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), albumId)

  private fun queryTracks(ctx: Context, selection: String?, args: Array<String>?, sort: String?, limit: Int = 0): List<Track> {
    val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q)
      MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL) else MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
    val cols = arrayOf(
      MediaStore.Audio.Media._ID,
      MediaStore.Audio.Media.TITLE,
      MediaStore.Audio.Media.ARTIST,
      MediaStore.Audio.Media.ALBUM,
      MediaStore.Audio.Media.ALBUM_ID,
      MediaStore.Audio.Media.DURATION,
    )
    return query(ctx, collection, cols, selection, args, sort, limit) { c ->
      val id = c.getLong(0)
      Track(
        id = id,
        title = c.getString(1) ?: "Untitled",
        artist = c.getString(2),
        album = c.getString(3),
        albumId = c.getLong(4),
        uri = ContentUris.withAppendedId(collection, id),
        durationMs = c.getLong(5).coerceAtLeast(0L),
      )
    }
  }

  private inline fun <T> query(
    ctx: Context,
    uri: Uri,
    cols: Array<String>,
    selection: String?,
    args: Array<String>?,
    sort: String?,
    limit: Int = 0,
    crossinline map: (Cursor) -> T,
  ): List<T> {
    val out = ArrayList<T>()
    val cursor = if (limit > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val queryArgs = Bundle().apply {
        if (selection != null) putString(ContentResolver.QUERY_ARG_SQL_SELECTION, selection)
        if (args != null) putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, args)
        if (sort != null) putString(ContentResolver.QUERY_ARG_SQL_SORT_ORDER, sort)
        putInt(ContentResolver.QUERY_ARG_LIMIT, limit)
      }
      ctx.contentResolver.query(uri, cols, queryArgs, null)
    } else {
      ctx.contentResolver.query(uri, cols, selection, args, sort)
    }
    cursor?.use { c ->
      while (c.moveToNext()) out.add(map(c))
    }
    return out
  }
}
