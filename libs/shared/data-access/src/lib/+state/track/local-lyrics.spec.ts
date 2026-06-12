import { Track } from '@metal-p3/track/domain';
import { Album } from '../model';
import { albumAdapter, albumsFeature, maTrackAdapter, trackAdapter } from '../reducer';
import { selectLyricsCompletedCount, selectLyricsExpected, selectLyricsExpectedTotal, selectLyricsInFlightCount } from '../selectors';
import { TrackActions } from './actions';

const { reducer } = albumsFeature;

function track(overrides: Partial<Track> = {}): Track {
  return {
    id: 1,
    fullPath: '/music/01.mp3',
    folder: '/music',
    file: '01.mp3',
    trackNumber: '01',
    title: 'Track One',
    ...overrides,
  } as Track;
}

function albumWith(tracks: Track[], overrides: Partial<Album> = {}): Album {
  return {
    id: 1,
    bandId: 1,
    fullPath: '/music',
    folder: '/music',
    dateCreated: '2024-01-01',
    tracks: trackAdapter.setAll(tracks, trackAdapter.getInitialState()),
    maTracks: maTrackAdapter.getInitialState(),
    ...overrides,
  } as Album;
}

function stateWith(album: Album) {
  return albumAdapter.setAll([album], albumAdapter.getInitialState({ selectedAlbumId: album.id })) as never;
}

function trackAfter(state: ReturnType<typeof reducer>, albumId: number, trackId: number): Track {
  const updated = state.entities[albumId]?.tracks.entities[trackId];
  if (!updated) {
    throw new Error(`track ${trackId} not found on album ${albumId}`);
  }
  return updated;
}

describe('local lyrics reducer', () => {
  it('marks the local track as loading on getLocalLyrics', () => {
    const state = stateWith(albumWith([track()]));

    const next = reducer(state, TrackActions.getLocalLyrics({ id: 1, localTrackId: 1, artist: 'a', track: 't', album: 'al' }));

    const updated = trackAfter(next, 1, 1);
    expect(updated.lyricsLoading).toBe(true);
    expect(updated.lyricsChecked).toBeUndefined();
  });

  it('writes synced lyrics and synced source on success with syncedLyrics', () => {
    const state = stateWith(albumWith([track({ lyricsLoading: true })]));

    const next = reducer(state, TrackActions.getLocalLyricsSuccess({ id: 1, localTrackId: 1, syncedLyrics: '[00:01.00] hi', plainLyrics: null }));

    const updated = trackAfter(next, 1, 1);
    expect(updated.syncedLyrics).toBe('[00:01.00] hi');
    expect(updated.lyricsSource).toBe('synced');
    expect(updated.lyricsLoading).toBe(false);
    expect(updated.lyricsChecked).toBe(true);
  });

  it('falls back to plain lyrics when there are no synced lyrics', () => {
    const state = stateWith(albumWith([track({ lyricsLoading: true })]));

    const next = reducer(state, TrackActions.getLocalLyricsSuccess({ id: 1, localTrackId: 1, syncedLyrics: null, plainLyrics: 'just words' }));

    const updated = trackAfter(next, 1, 1);
    expect(updated.lyrics).toBe('just words');
    expect(updated.lyricsSource).toBe('plain');
    expect(updated.syncedLyrics).toBeUndefined();
    expect(updated.lyricsChecked).toBe(true);
  });

  it('marks the track checked but clears loading on a miss', () => {
    const state = stateWith(albumWith([track({ lyricsLoading: true })]));

    const next = reducer(state, TrackActions.getLocalLyricsMiss({ id: 1, localTrackId: 1 }));

    const updated = trackAfter(next, 1, 1);
    expect(updated.lyricsLoading).toBe(false);
    expect(updated.lyricsChecked).toBe(true);
    expect(updated.lyrics).toBeUndefined();
    expect(updated.syncedLyrics).toBeUndefined();
  });
});

describe('lyrics progress selectors for albums without a metal-archives url', () => {
  it('counts every local track as expected', () => {
    const album = albumWith([track({ id: 1 }), track({ id: 2 })]);
    expect(selectLyricsExpectedTotal.projector(album, undefined, trackAdapter.getSelectors().selectAll(album.tracks))).toBe(2);
  });

  it('counts checked local tracks as completed', () => {
    const album = albumWith([track({ id: 1, lyricsChecked: true }), track({ id: 2 })]);
    const tracks = trackAdapter.getSelectors().selectAll(album.tracks);
    expect(selectLyricsCompletedCount.projector(album, undefined, tracks)).toBe(1);
  });

  it('counts in-flight local tracks', () => {
    const album = albumWith([track({ id: 1, lyricsLoading: true }), track({ id: 2 })]);
    const tracks = trackAdapter.getSelectors().selectAll(album.tracks);
    expect(selectLyricsInFlightCount.projector(album, undefined, tracks)).toBe(1);
  });

  it('expects lyrics while a local track is neither checked nor loading', () => {
    const album = albumWith([track({ id: 1, lyricsChecked: true }), track({ id: 2 })]);
    const tracks = trackAdapter.getSelectors().selectAll(album.tracks);
    expect(selectLyricsExpected.projector(album, undefined, tracks)).toBe(true);
  });

  it('stops expecting lyrics once every local track is checked', () => {
    const album = albumWith([track({ id: 1, lyricsChecked: true }), track({ id: 2, lyricsChecked: true })]);
    const tracks = trackAdapter.getSelectors().selectAll(album.tracks);
    expect(selectLyricsExpected.projector(album, undefined, tracks)).toBe(false);
  });
});

describe('lyrics progress selectors fall back to metal-archives tracks when an album has a url', () => {
  const maTracks = [
    { id: 'a', hasLyrics: true, lyrics: 'x' },
    { id: 'b', hasLyrics: true, lyrics: null as unknown as string },
    { id: 'c', hasLyrics: false },
  ];

  it('uses metal-archives tracks for expected total', () => {
    const album = albumWith([track()], { albumUrl: 'https://metal-archives.com/x' });
    expect(selectLyricsExpectedTotal.projector(album, maTracks, [])).toBe(2);
  });

  it('uses metal-archives tracks for completed count', () => {
    const album = albumWith([track()], { albumUrl: 'https://metal-archives.com/x' });
    expect(selectLyricsCompletedCount.projector(album, maTracks, [])).toBe(1);
  });
});
