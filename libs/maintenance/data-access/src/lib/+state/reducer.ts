import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  checkedLyricsHistorySuccess,
  checkLyricsHistory,
  deleteLyricsHistorySuccess,
  getLyricsHistory,
  getLyricsHistorySuccess,
  getUrlMatcher,
  getUrlMatcherSuccess,
  stopLyricsCheck,
  updateLyricsHistory,
  updateUrlMatcher,
} from './actions';

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

export const reducer = createReducer(
  initialState,
  on(getLyricsHistory, (state) => ({ ...state, gettingLyrics: true })),
  on(getLyricsHistorySuccess, (state, { history }) => ({ ...state, gettingLyrics: false, lyrics: lyricsAdapter.setAll(history, state.lyrics) })),
  on(checkLyricsHistory, (state) => ({ ...state, checkingLyrics: true })),
  on(stopLyricsCheck, (state) => ({ ...state, checkingLyrics: false })),
  on(updateLyricsHistory, checkedLyricsHistorySuccess, (state, { update }) => ({ ...state, lyrics: lyricsAdapter.updateOne(update, state.lyrics) })),
  on(deleteLyricsHistorySuccess, (state, { id }) => ({ ...state, lyrics: lyricsAdapter.removeOne(id, state.lyrics) })),

  on(getUrlMatcher, (state) => ({ ...state, gettingMetalArchivesMatcher: true })),
  on(getUrlMatcherSuccess, (state, { albums }) => ({
    ...state,
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: true,
    metalArchivesMatcher: metalArchivesMatcherAdapter.setAll(albums, state.metalArchivesMatcher),
  })),
  on(updateUrlMatcher, (state, { update }) => ({ ...state, metalArchivesMatcher: metalArchivesMatcherAdapter.updateOne(update, state.metalArchivesMatcher) }))
);
