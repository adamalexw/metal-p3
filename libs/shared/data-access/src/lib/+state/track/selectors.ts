import { createSelector } from '@ngrx/store';
import { selectAlbum, selectAlbumById } from '../album/selectors';
import { maTrackAdapter, trackAdapter } from '../reducer';

export const selectTrackCount = createSelector(selectAlbum, (album) => album && album.tracks && trackAdapter.getSelectors().selectTotal(album.tracks));
export const selectTracksLoading = createSelector(selectAlbum, (album) => album?.tracksLoading || false);
export const selectTracks = createSelector(selectAlbum, (album) => album && album.tracks && trackAdapter.getSelectors().selectAll(album.tracks));
export const selectTracksError = createSelector(selectAlbum, (album) => album?.tracksError);
export const selectTracksRequired = createSelector(selectTracks, selectTracksLoading, (tracks, loading) => (loading ? false : !tracks));
export const selectTracksDuration = createSelector(selectTracks, (tracks) => tracks?.map((track) => track.duration || 0)?.reduce((accumulator, current) => (accumulator += current), 0) || 0);
export const selectGettingMaTracks = createSelector(selectAlbum, (album) => album?.gettingMaTracks || false);
export const selectMaTracks = createSelector(selectAlbum, (album) => album && album.maTracks && maTrackAdapter.getSelectors().selectAll(album.maTracks));

export const selectTrack = (id: number, trackId: number) => createSelector(selectAlbumById(id), (album) => album?.tracks.entities[trackId]);
export const selectTracksById = (id: number) => createSelector(selectAlbumById(id), (album) => album?.tracks && trackAdapter.getSelectors().selectAll(album.tracks));
export const selectTracksRequiredById = (id: number) => createSelector(selectTracksById(id), selectAlbumById(id), (tracks, album) => (album?.tracksLoading ? false : !tracks));
