import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { MaintenanceActions } from './actions';

export const MAINTENANCE_FEATURE_KEY = 'maintenance';

export const lyricsAdapter: EntityAdapter<LyricsHistoryDto> = createEntityAdapter<LyricsHistoryDto>();
export const metalArchivesMatcherAdapter: EntityAdapter<UrlMatcher> = createEntityAdapter<UrlMatcher>();

export interface MaintenanceState {
  gettingLyrics: boolean;
  checkingLyrics: boolean;
  lyrics: EntityState<LyricsHistoryDto>;

  gettingMetalArchivesMatcher: boolean;
  metalArchivesMatcherLoaded: boolean;
  metalArchivesMatcher: EntityState<UrlMatcher>;
}

export const initialState: MaintenanceState = {
  gettingLyrics: false,
  checkingLyrics: false,
  lyrics: lyricsAdapter.getInitialState(),

  gettingMetalArchivesMatcher: false,
  metalArchivesMatcherLoaded: false,
  metalArchivesMatcher: metalArchivesMatcherAdapter.getInitialState(),
};

export const maintenanceFeature = createFeature({
  name: MAINTENANCE_FEATURE_KEY,
  reducer: createReducer(
    initialState,
    on(MaintenanceActions.getLyricsHistory, (state): MaintenanceState => ({ ...state, gettingLyrics: true })),
    on(MaintenanceActions.getLyricsHistorySuccess, (state, { history }) => ({ ...state, gettingLyrics: false, lyrics: lyricsAdapter.setAll(history, state.lyrics) })),
    on(MaintenanceActions.checkLyricsHistory, (state): MaintenanceState => ({ ...state, checkingLyrics: true })),
    on(MaintenanceActions.stopLyricsHistoryCheck, (state): MaintenanceState => ({ ...state, checkingLyrics: false })),
    on(MaintenanceActions.updateLyricsHistory, MaintenanceActions.checkedLyricsHistorySuccess, (state, { update }) => ({ ...state, lyrics: lyricsAdapter.updateOne(update, state.lyrics) })),
    on(MaintenanceActions.deleteLyricsHistorySuccess, (state, { id }) => ({ ...state, lyrics: lyricsAdapter.removeOne(id, state.lyrics) })),
    on(MaintenanceActions.getUrlMatcher, (state): MaintenanceState => ({ ...state, gettingMetalArchivesMatcher: true })),
    on(MaintenanceActions.getUrlMatcherSuccess, (state, { albums }) => ({
      ...state,
      gettingMetalArchivesMatcher: false,
      metalArchivesMatcherLoaded: true,
      metalArchivesMatcher: metalArchivesMatcherAdapter.setAll(albums, state.metalArchivesMatcher),
    })),
    on(MaintenanceActions.updateUrlMatcher, (state, { update }) => ({ ...state, metalArchivesMatcher: metalArchivesMatcherAdapter.updateOne(update, state.metalArchivesMatcher) }))
  ),
});
