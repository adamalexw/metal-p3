import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, PlaylistState, PLAYLIST_FEATURE_KEY } from './reducer';

export const selectPlaylistState = createFeatureSelector<PlaylistState>(PLAYLIST_FEATURE_KEY);

const { selectEntities, selectAll } = adapter.getSelectors();

export const selectPlaylistEntities = createSelector(selectPlaylistState, selectEntities);
export const selectPlaylists = createSelector(selectPlaylistState, (state) => selectAll(state));

export const selectActivePlaylistId = createSelector(selectPlaylistState, (state) => state.active);
export const selectActivePlaylist = createSelector(selectPlaylists, selectActivePlaylistId, (playlists, id) => playlists.find((e) => e.id === id));

export const selectPlaylistById = (id: number) => createSelector(selectPlaylists, (playlists) => playlists.find((item) => item.id === id));
