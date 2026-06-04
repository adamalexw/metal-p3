import { ImportedSetlist, ResolvedTrack } from '@metal-p3/setlist-importer/domain';
import { createReducer, on } from '@ngrx/store';
import { SetlistImporterActions } from './actions';

export const SETLIST_IMPORTER_FEATURE_KEY = 'setlistImporter';

export interface SetlistImporterState {
  urls: string[];
  setlists: ImportedSetlist[];
  tracks: ResolvedTrack[];
  scraping: boolean;
  matching: boolean;
  creating: boolean;
  error: string | undefined;
}

const initialState: SetlistImporterState = {
  urls: [],
  setlists: [],
  tracks: [],
  scraping: false,
  matching: false,
  creating: false,
  error: undefined,
};

export const setlistImporterFeature = {
  name: SETLIST_IMPORTER_FEATURE_KEY,
  reducer: createReducer(
    initialState,
    on(SetlistImporterActions.setUrls, (state, { urls }): SetlistImporterState => ({ ...state, urls })),
    on(SetlistImporterActions.scrape, (state): SetlistImporterState => ({ ...state, scraping: true, error: undefined })),
    on(SetlistImporterActions.scrapeSuccess, (state, { setlists }): SetlistImporterState => ({ ...state, scraping: false, setlists, tracks: [] })),
    on(SetlistImporterActions.scrapeError, (state, { error }): SetlistImporterState => ({ ...state, scraping: false, error })),
    on(SetlistImporterActions.match, (state): SetlistImporterState => ({ ...state, matching: true, error: undefined })),
    on(SetlistImporterActions.matchSuccess, (state, { tracks }): SetlistImporterState => ({ ...state, matching: false, tracks })),
    on(SetlistImporterActions.matchError, (state, { error }): SetlistImporterState => ({ ...state, matching: false, error })),
    on(
      SetlistImporterActions.toggleTrackSelection,
      (state, { key }): SetlistImporterState => ({
        ...state,
        tracks: state.tracks.map((t) => (t.key === key ? { ...t, selected: !t.selected } : t)),
      }),
    ),
    on(
      SetlistImporterActions.setAllSelection,
      (state, { selected }): SetlistImporterState => ({
        ...state,
        tracks: state.tracks.map((t) => (t.status === 'matched' ? { ...t, selected } : t)),
      }),
    ),
    on(SetlistImporterActions.createPlaylist, (state): SetlistImporterState => ({ ...state, creating: true, error: undefined })),
    on(SetlistImporterActions.createPlaylistSuccess, (state): SetlistImporterState => ({ ...state, creating: false })),
    on(SetlistImporterActions.createPlaylistError, (state, { error }): SetlistImporterState => ({ ...state, creating: false, error })),
    on(SetlistImporterActions.reset, (): SetlistImporterState => initialState),
  ),
};
