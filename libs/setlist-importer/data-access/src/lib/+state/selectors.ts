import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SETLIST_IMPORTER_FEATURE_KEY, SetlistImporterState } from './reducer';

export const selectSetlistImporterState = createFeatureSelector<SetlistImporterState>(SETLIST_IMPORTER_FEATURE_KEY);

export const selectSetlistImporterUrls = createSelector(selectSetlistImporterState, (state) => state.urls);
export const selectSetlistImporterSetlists = createSelector(selectSetlistImporterState, (state) => state.setlists);
export const selectSetlistImporterTracks = createSelector(selectSetlistImporterState, (state) => state.tracks);

export const selectSetlistImporterScraping = createSelector(selectSetlistImporterState, (state) => state.scraping);
export const selectSetlistImporterMatching = createSelector(selectSetlistImporterState, (state) => state.matching);
export const selectSetlistImporterCreating = createSelector(selectSetlistImporterState, (state) => state.creating);
export const selectSetlistImporterError = createSelector(selectSetlistImporterState, (state) => state.error);

export const selectSetlistImporterMatchedCount = createSelector(selectSetlistImporterTracks, (tracks) => tracks.filter((t) => t.status === 'matched').length);
export const selectSetlistImporterMissingCount = createSelector(selectSetlistImporterTracks, (tracks) => tracks.filter((t) => t.status === 'missing').length);
export const selectSetlistImporterSelectedCount = createSelector(selectSetlistImporterTracks, (tracks) => tracks.filter((t) => t.selected).length);
