import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';

export interface AlbumGroup {
  key: string;
  albumName: string;
  bandName: string;
  genre: string | null;
  tracks: Track[];
  trackCount: number;
  totalDurationMs: number;
  representativeUri: string;
}

export const UNKNOWN_ALBUM = 'Unknown album';
export const UNKNOWN_ARTIST = 'Unknown artist';

function bandFromTrack(track: Track): string {
  return track.albumArtist ?? track.artist ?? UNKNOWN_ARTIST;
}

function albumFromTrack(track: Track): string {
  return track.album ?? UNKNOWN_ALBUM;
}

function groupKey(track: Track): string {
  return `${bandFromTrack(track).toLowerCase().trim()}|${albumFromTrack(track).toLowerCase().trim()}`;
}

function compareTracks(a: Track, b: Track): number {
  const da = a.discNumber ?? 1;
  const db = b.discNumber ?? 1;
  if (da !== db) return da - db;
  const ta = a.trackNumber ?? Number.MAX_SAFE_INTEGER;
  const tb = b.trackNumber ?? Number.MAX_SAFE_INTEGER;
  if (ta !== tb) return ta - tb;
  return (a.title ?? '').localeCompare(b.title ?? '');
}

export function groupTracksByAlbum(tracks: Track[]): AlbumGroup[] {
  const buckets = new Map<string, Track[]>();
  for (const track of tracks) {
    const key = groupKey(track);
    const existing = buckets.get(key);
    if (existing) existing.push(track);
    else buckets.set(key, [track]);
  }

  const groups: AlbumGroup[] = [];
  for (const [key, list] of buckets) {
    const sorted = [...list].sort(compareTracks);
    const first = sorted[0];
    groups.push({
      key,
      albumName: albumFromTrack(first),
      bandName: bandFromTrack(first),
      genre: first.genre ?? null,
      tracks: sorted,
      trackCount: sorted.length,
      totalDurationMs: sorted.reduce((sum, t) => sum + (t.durationMs ?? 0), 0),
      representativeUri: first.uri,
    });
  }

  groups.sort((a, b) => {
    const byBand = a.bandName.toLowerCase().localeCompare(b.bandName.toLowerCase());
    if (byBand !== 0) return byBand;
    return a.albumName.toLowerCase().localeCompare(b.albumName.toLowerCase());
  });

  return groups;
}

export function formatAlbumDuration(totalMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, totalMs) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours >= 1) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
