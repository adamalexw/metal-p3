import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, PlayerState, PLAYER_FEATURE_KEY } from './reducer';

export const selectPlaylistState = createFeatureSelector<PlayerState>(PLAYER_FEATURE_KEY);

const { selectEntities, selectAll } = adapter.getSelectors();

export const selectMiniMode = createSelector(selectPlaylistState, (state) => state.miniMode);

export const selectPlaylistEntities = createSelector(selectPlaylistState, selectEntities);
export const selectPlaylist = createSelector(selectPlaylistState, (state) => selectAll(state));

export const selectActiveItemId = createSelector(selectPlaylistState, (state) => state.activeTrack);
export const selectActivePlaylistItem = createSelector(selectPlaylistEntities, selectActiveItemId, (playlist, id) => (playlist && id ? playlist[id] : undefined));

export const selectActiveItemIndex = createSelector(selectPlaylist, selectActiveItemId, (playlist, item) => playlist && playlist.findIndex((pl) => pl.id === item));
export const selectFirstItemPlaying = createSelector(selectActiveItemIndex, (index) => index === 0);
export const selectLastItemPlaying = createSelector(selectActiveItemIndex, selectPlaylist, (index, playlist) => index === playlist.length - 1);
