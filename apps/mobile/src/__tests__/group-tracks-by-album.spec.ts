import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { formatAlbumDuration, groupTracksByAlbum } from '../lib/group-tracks-by-album';

function makeTrack(overrides: Partial<Track> & { id: string; uri: string }): Track {
  return {
    title: null,
    artist: null,
    album: null,
    albumArtist: null,
    genre: null,
    durationMs: 0,
    year: null,
    trackNumber: null,
    discNumber: null,
    mimeType: null,
    sizeBytes: 0,
    ...overrides,
  };
}

describe('groupTracksByAlbum', () => {
  it('groups tracks with the same albumArtist + album into one group', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', albumArtist: 'Mastodon', album: 'Leviathan', trackNumber: 1, durationMs: 60_000 }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: 'Mastodon', album: 'Leviathan', trackNumber: 2, durationMs: 90_000 }),
    ];

    const groups = groupTracksByAlbum(tracks);

    expect(groups).toHaveLength(1);
    expect(groups[0].albumName).toBe('Leviathan');
    expect(groups[0].bandName).toBe('Mastodon');
    expect(groups[0].trackCount).toBe(2);
    expect(groups[0].totalDurationMs).toBe(150_000);
  });

  it('separates same-titled albums under different bands', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', albumArtist: 'Band A', album: 'Self Titled' }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: 'Band B', album: 'Self Titled' }),
    ];

    const groups = groupTracksByAlbum(tracks);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.bandName).sort()).toEqual(['Band A', 'Band B']);
  });

  it('sorts intra-group tracks by discNumber then trackNumber', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', albumArtist: 'X', album: 'Y', discNumber: 2, trackNumber: 1, title: 'D2-T1' }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: 'X', album: 'Y', discNumber: 1, trackNumber: 5, title: 'D1-T5' }),
      makeTrack({ id: '3', uri: 'a://3', albumArtist: 'X', album: 'Y', discNumber: 1, trackNumber: 1, title: 'D1-T1' }),
    ];

    const [group] = groupTracksByAlbum(tracks);

    expect(group.tracks.map((t) => t.title)).toEqual(['D1-T1', 'D1-T5', 'D2-T1']);
    expect(group.representativeUri).toBe('a://3');
  });

  it('falls back to artist when albumArtist is null and uses Unknown labels for missing fields', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', artist: 'Solo Act', album: null }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: null, artist: null, album: null }),
    ];

    const groups = groupTracksByAlbum(tracks);

    expect(groups).toHaveLength(2);
    const solo = groups.find((g) => g.bandName === 'Solo Act');
    const unknown = groups.find((g) => g.bandName === 'Unknown artist');
    expect(solo?.albumName).toBe('Unknown album');
    expect(unknown?.albumName).toBe('Unknown album');
  });

  it('sets group genre from the first sorted track', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', albumArtist: 'X', album: 'Y', trackNumber: 2, genre: 'Death Metal' }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: 'X', album: 'Y', trackNumber: 1, genre: 'Black Metal' }),
    ];

    const [group] = groupTracksByAlbum(tracks);

    expect(group.genre).toBe('Black Metal');
  });

  it('returns null genre when no track has one', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', albumArtist: 'X', album: 'Y', trackNumber: 1 }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: 'X', album: 'Y', trackNumber: 2 }),
    ];

    const [group] = groupTracksByAlbum(tracks);

    expect(group.genre).toBeNull();
  });

  it('sorts groups by band name then album name, case-insensitive', () => {
    const tracks: Track[] = [
      makeTrack({ id: '1', uri: 'a://1', albumArtist: 'zebra', album: 'A' }),
      makeTrack({ id: '2', uri: 'a://2', albumArtist: 'Alpha', album: 'B' }),
      makeTrack({ id: '3', uri: 'a://3', albumArtist: 'Alpha', album: 'A' }),
    ];

    const groups = groupTracksByAlbum(tracks);

    expect(groups.map((g) => `${g.bandName}/${g.albumName}`)).toEqual(['Alpha/A', 'Alpha/B', 'zebra/A']);
  });
});

describe('formatAlbumDuration', () => {
  it('formats sub-hour durations as M:SS', () => {
    expect(formatAlbumDuration(0)).toBe('0:00');
    expect(formatAlbumDuration(7_000)).toBe('0:07');
    expect(formatAlbumDuration(2_527_000)).toBe('42:07');
  });

  it('formats hour-and-over durations as H:MM:SS', () => {
    expect(formatAlbumDuration(3_600_000)).toBe('1:00:00');
    expect(formatAlbumDuration(5_025_000)).toBe('1:23:45');
  });

  it('floors fractional seconds and clamps negatives to zero', () => {
    expect(formatAlbumDuration(1_999)).toBe('0:01');
    expect(formatAlbumDuration(-500)).toBe('0:00');
  });
});
