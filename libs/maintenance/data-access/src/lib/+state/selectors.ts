import { createFeatureSelector, createSelector } from '@ngrx/store';
import { lyricsAdapter, MaintenanceState, MAINTENANCE_FEATURE_KEY } from './reducer';

export const selectMaintenceState = createFeatureSelector<MaintenanceState>(MAINTENANCE_FEATURE_KEY);

const { selectAll } = lyricsAdapter.getSelectors();

export const selectLyrics = createSelector(selectMaintenceState, (state) => selectAll(state.lyrics));

export const selectGettingLyrics = createSelector(selectMaintenceState, (state) => state.gettingLyrics);
export const selectCheckingLyrics = createSelector(selectMaintenceState, (state) => state.checkingLyrics);
