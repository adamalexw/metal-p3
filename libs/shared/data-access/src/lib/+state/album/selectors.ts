import { createFeatureSelector, createSelector } from '@ngrx/store';
import { albumAdapter, AlbumState, ALBUMS_FEATURE_KEY } from '../reducer';

export const selectAlbumState = createFeatureSelector<AlbumState>(ALBUMS_FEATURE_KEY);

const { selectEntities, selectAll } = albumAdapter.getSelectors();

export const selectAlbumEntities = createSelector(selectAlbumState, selectEntities);
export const selectAlbums = createSelector(selectAlbumState, (state: AlbumState) => selectAll(state));

export const selectSelectedAlbumId = createSelector(selectAlbumState, (state: AlbumState) => state.selectedAlbumId);

export const selectAlbum = createSelector(selectAlbumEntities, selectSelectedAlbumId, (albums, id) => (albums && id ? albums[id] : undefined));
export const selectAlbumById = (id: number) => createSelector(selectAlbumEntities, (entities) => entities && entities[id]);
export const selectSaveAlbumError = createSelector(selectAlbum, (album) => album?.saveError);

export const selectAlbumsLoading = createSelector(selectAlbumState, (state: AlbumState) => state?.loading);
export const selectAlbumsLoaded = createSelector(selectAlbumState, (state: AlbumState) => state?.loaded);
export const selectAlbumsLoadError = createSelector(selectAlbumState, (state: AlbumState) => state?.loadError);
export const selectAlbumsSearchRequest = createSelector(selectAlbumState, (state: AlbumState) => state?.searchRequest);
export const selectAlbumsSearchCriteria = createSelector(selectAlbumsSearchRequest, (request) => request?.criteria);

export const selectFindingUrl = createSelector(selectAlbum, (album) => album?.findingUrl || false);
export const selectMaUrls = createSelector(selectAlbum, (album) => ({ artistUrl: album?.artistUrl, albumUrl: album?.albumUrl }));

export const selectCreatingNew = createSelector(selectAlbumState, (state) => state.creatingNew || false);
export const selectRenamingFolder = createSelector(selectAlbum, (album) => album?.renamingFolder || false);
export const selectRenamingFolderError = createSelector(selectAlbum, (album) => album?.renamingFolderError);

export const selectAlbumFolder = createSelector(selectAlbum, (album) => album?.folder);
export const selectAlbumUrl = createSelector(selectAlbum, (album) => album?.albumUrl);
