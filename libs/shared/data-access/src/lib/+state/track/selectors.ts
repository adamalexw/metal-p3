import { createSelector } from '@ngrx/store';
import { selectAlbum, selectAlbumById } from '../album/selectors';
import { maTrackAdapter, trackAdapter } from '../reducer';

export const selectTrackCount = createSelector(selectAlbum, (album) => album && album.tracks && trackAdapter.getSelectors().selectTotal(album.tracks));
export const selectTracksLoading = createSelector(selectAlbum, (album) => album?.tracksLoading);
export const selectTracks = createSelector(selectAlbum, (album) => album && album.tracks && trackAdapter.getSelectors().selectAll(album.tracks));
export const selectTracksRequired = createSelector(selectTracks, selectTracksLoading, (tracks, loading) => {
  if (loading) {
    return false;
  }

  return !tracks;
});
export const selectGettingMaTracks = createSelector(selectAlbum, (album) => album?.gettingMaTracks);
export const selectMaTracks = createSelector(selectAlbum, (album) => album && album.maTracks && maTrackAdapter.getSelectors().selectAll(album.maTracks));
export const selectTrack = (id: number, trackId: number) => createSelector(selectAlbumById(id), (album) => album?.tracks.entities[trackId]);
