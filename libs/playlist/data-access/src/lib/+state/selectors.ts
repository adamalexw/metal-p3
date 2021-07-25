import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, PlaylistState, PLAYLIST_FEATURE_KEY } from './reducer';

export const selectPlaylistState = createFeatureSelector<PlaylistState>(PLAYLIST_FEATURE_KEY);

const { selectEntities, selectAll, selectTotal } = adapter.getSelectors();

export const selectPlaylistEntities = createSelector(selectPlaylistState, selectEntities);
export const selectPlaylists = createSelector(selectPlaylistState, (state) => selectAll(state));
export const selectPlaylistItemSize = createSelector(selectPlaylistState, selectTotal);

export const selectActivePlaylist = createSelector(selectPlaylistState, (state) => state.active);

export const selectPlaylistById = (id: number) => createSelector(selectPlaylists, (playlists) => playlists.find((item) => item.id === id));