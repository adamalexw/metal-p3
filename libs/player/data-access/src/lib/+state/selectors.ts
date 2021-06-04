import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, PlayerState, PLAYER_FEATURE_KEY } from './reducer';

export const selectPlaylistState = createFeatureSelector<PlayerState>(PLAYER_FEATURE_KEY);

const { selectEntities, selectAll } = adapter.getSelectors();

export const selectPlaylistEntities = createSelector(selectPlaylistState, selectEntities);
export const selectPlaylist = createSelector(selectPlaylistState, (state: PlayerState) => selectAll(state));
export const selectedTrack = createSelector(selectPlaylistState, (state) => state.activeTrack);
export const selectTrack = createSelector(selectPlaylistEntities, selectedTrack, (playlist, id) => (playlist && id ? playlist[id] : undefined));
export const firstTrackPlaying = createSelector(selectTrack, (track) => track?.playing);
