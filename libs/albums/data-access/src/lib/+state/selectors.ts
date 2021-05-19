import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, AlbumState, ALBUMS_FEATURE_KEY, maTrackAdapter, trackAdapter } from './reducer';
import { selectRouteParams } from './router.selectors';

export const selectAlbumState = createFeatureSelector<AlbumState>(ALBUMS_FEATURE_KEY);

const { selectIds, selectEntities, selectAll } = adapter.getSelectors();

export const selectAlbumIds = selectIds;

export const selectAlbumEntities = createSelector(selectAlbumState, selectEntities);

export const selectAlbumsLoading = createSelector(selectAlbumState, (state: AlbumState) => state.loading);
export const selectAlbumsLoaded = createSelector(selectAlbumState, (state: AlbumState) => state.loaded);
export const selectAlbums = createSelector(selectAlbumState, (state: AlbumState) => selectAll(state));

export const selectAlbum = createSelector(selectAlbumEntities, selectRouteParams, (albums, { id }) => albums && albums[id]);
export const selectTracks = createSelector(selectAlbum, (album) => album && album.tracks && trackAdapter.getSelectors().selectAll(album.tracks));
export const selectAlbumSaving = createSelector(selectAlbum, selectTracks, (album, tracks) => album?.saving || tracks?.some((track) => track.trackSaving));

export const selectCoverLoading = createSelector(selectAlbum, (album) => album?.coverLoading);
export const selectCover = createSelector(selectAlbum, (album) => album?.cover);

export const selectTracksLoading = createSelector(selectAlbum, (album) => album?.tracksLoading);

export const selectFindingUrl = createSelector(selectAlbum, (album) => album?.findingUrl);
export const selectMaUrls = createSelector(selectAlbum, (album) => ({ artistUrl: album?.artistUrl, albumUrl: album?.albumUrl }));

export const selectRenamingTracks = createSelector(selectAlbum, (album) => album?.renamingTracks);

export const selectGettingLyrics = createSelector(selectAlbum, (album) => album?.gettingLyrics);
export const selectGettingMaTracks = createSelector(selectAlbum, (album) => album?.gettingMaTracks);
export const selectMaTracks = createSelector(selectAlbum, (album) => album && album.maTracks && maTrackAdapter.getSelectors().selectAll(album.maTracks));

export const selectAlbumById = (id: number) => createSelector(selectAlbumEntities, (entities) => entities && entities[id]);
export const selectCoverLoadingByAlbumId = (id: number) => createSelector(selectAlbumById(id), (album) => album?.coverLoading);
