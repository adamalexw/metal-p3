import { createFeatureSelector, createSelector } from '@ngrx/store';
import { lyricsAdapter, MaintenanceState, MAINTENANCE_FEATURE_KEY, metalArchivesMatcherAdapter } from './reducer';

export const selectMaintenceState = createFeatureSelector<MaintenanceState>(MAINTENANCE_FEATURE_KEY);

export const selectLyrics = createSelector(selectMaintenceState, (state) => lyricsAdapter.getSelectors().selectAll(state.lyrics));
export const selectGettingLyrics = createSelector(selectMaintenceState, (state) => state.gettingLyrics);
export const selectCheckingLyrics = createSelector(selectMaintenceState, (state) => state.checkingLyrics);

export const selectMetalArchivesMatcher = createSelector(selectMaintenceState, (state) => metalArchivesMatcherAdapter.getSelectors().selectAll(state.metalArchivesMatcher));
export const selectGettingMetalArchivesMatcher = createSelector(selectMaintenceState, (state) => state.gettingMetalArchivesMatcher);
export const selectMetalArchivesMatcherLoaded = createSelector(selectMaintenceState, (state) => state.metalArchivesMatcherLoaded);
