import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { Update } from '@ngrx/entity';
import { MaintenanceActions } from './actions';
import { initialState, reducer } from './reducer';

it('MaintenanceActions.getLyricsHistory sets gettingLyrics to true', () => {
  const priority = false;
  const state = reducer(initialState, MaintenanceActions.getLyricsHistory({ priority }));

  expect(state).toEqual({
    gettingLyrics: true,
    checkingLyrics: false,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.getLyricsHistorySuccess add the lyrics history and reset gettingLyrics flag', () => {
  const history: LyricsHistoryDto[] = [
    {
      id: 1,
      albumId: 1,
      url: 'url',
      folder: 'folder',
    },
  ];

  const state = reducer(initialState, MaintenanceActions.getLyricsHistorySuccess({ history }));

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [1],
      entities: {
        1: history[0],
      },
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.checkLyricsHistory sets checkingLyrics to true', () => {
  const priority = false;
  const state = reducer(initialState, MaintenanceActions.checkLyricsHistory({ priority }));

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: true,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.stopLyricsHistoryCheck sets checkingLyrics to false', () => {
  const state = reducer(initialState, MaintenanceActions.stopLyricsHistoryCheck());

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.updateLyricsHistory update lyrics history entity complete property', () => {
  const history: LyricsHistoryDto[] = [
    {
      id: 1,
      albumId: 1,
      url: 'url',
      folder: 'folder',
    },
  ];

  const update: Update<LyricsHistoryDto> = {
    id: 1,
    changes: {
      complete: true,
    },
  };

  const state = reducer(
    {
      ...initialState,
      lyrics: {
        ids: [1],
        entities: {
          1: history[0],
        },
      },
    },
    MaintenanceActions.updateLyricsHistory({ update })
  );

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [1],
      entities: {
        1: { ...history[0], complete: true },
      },
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.deleteLyricsHistorySuccess delete lyrics entity', () => {
  const id = 1;
  const state = reducer(
    {
      ...initialState,
      lyrics: {
        ids: [1],
        entities: {
          1: {
            id: 1,
            albumId: 1,
            url: 'url',
            folder: 'folder',
          },
        },
      },
    },
    MaintenanceActions.deleteLyricsHistorySuccess({ id })
  );

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.getUrlMatcher sets gettingMetalArchivesMatcher to true', () => {
  const state = reducer(initialState, MaintenanceActions.getUrlMatcher());

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: true,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [],
      entities: {},
    },
  });
});

it('MaintenanceActions.getUrlMatcherSuccess add the metalArchivesMatcher, reset gettingMetalArchivesMatcher flag and set metalArchivesMatcherLoaded to true', () => {
  const albums: UrlMatcher[] = [
    {
      id: 1,
      bandId: 2,
      band: 'band',
      album: 'album',
    },
  ];

  const state = reducer(initialState, MaintenanceActions.getUrlMatcherSuccess({ albums }));

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: true,
    metalArchivesMatcher: {
      ids: [1],
      entities: {
        1: albums[0],
      },
    },
  });
});

it('MaintenanceActions.updateUrlMatcher update metalArchivesMatcher entity', () => {
  const albums: UrlMatcher[] = [
    {
      id: 1,
      bandId: 2,
      band: 'band',
      album: 'album',
    },
  ];

  const update: Update<UrlMatcher> = {
    id: 1,
    changes: {
      complete: true,
    },
  };

  const state = reducer(
    {
      ...initialState,
      metalArchivesMatcher: {
        ids: [1],
        entities: {
          1: albums[0],
        },
      },
    },
    MaintenanceActions.updateUrlMatcher({ update })
  );

  expect(state).toEqual({
    gettingLyrics: false,
    checkingLyrics: false,
    lyrics: {
      ids: [],
      entities: {},
    },
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
    metalArchivesMatcher: {
      ids: [1],
      entities: {
        1: { ...albums[0], complete: true },
      },
    },
  });
});
