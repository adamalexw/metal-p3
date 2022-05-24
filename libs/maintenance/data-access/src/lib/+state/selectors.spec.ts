import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { selectCheckingLyrics, selectGettingLyrics, selectGettingMetalArchivesMatcher, selectLyrics, selectMetalArchivesMatcher, selectMetalArchivesMatcherLoaded } from './selectors';

it('selects all lyrics history entities', () => {
  const history: LyricsHistoryDto[] = [
    {
      id: 1,
      albumId: 1,
      url: 'url',
      folder: 'folder',
    },
    {
      id: 2,
      albumId: 2,
      url: 'url1',
      folder: 'folder1',
    },
  ];

  const result = selectLyrics.projector({
    lyrics: {
      ids: [1, 2],
      entities: {
        1: history[0],
        2: history[1],
      },
    },
  });

  expect(result).toEqual(history);
});

it('selects gettingLyrics', () => {
  const result = selectGettingLyrics.projector({
    gettingLyrics: true,
  });

  expect(result).toEqual(true);
});

it('selects checkingLyrics', () => {
  const result = selectCheckingLyrics.projector({
    checkingLyrics: true,
  });

  expect(result).toEqual(true);
});

it('selects all metal archives matcher entities', () => {
  const albums: UrlMatcher[] = [
    {
      id: 1,
      bandId: 2,
      band: 'band',
      album: 'album',
    },
    {
      id: 2,
      bandId: 3,
      band: 'band1',
      album: 'album1',
    },
  ];

  const result = selectMetalArchivesMatcher.projector({
    metalArchivesMatcher: {
      ids: [1, 2],
      entities: {
        1: albums[0],
        2: albums[1],
      },
    },
  });

  expect(result).toEqual(albums);
});

it('selects gettingMetalArchivesMatcher', () => {
  const result = selectGettingMetalArchivesMatcher.projector({
    gettingMetalArchivesMatcher: true,
  });

  expect(result).toEqual(true);
});

it('selects metalArchivesMatcherLoaded', () => {
  const result = selectMetalArchivesMatcherLoaded.projector({
    metalArchivesMatcherLoaded: true,
  });

  expect(result).toEqual(true);
});
