import { MetalP3Media, type SyncedLyricsLine } from '../../modules/metalp3-media';
import { createAsyncCache } from './async-cache';

interface SyncedLyricsState {
  lines: SyncedLyricsLine[] | null;
  loading: boolean;
}

const syncedLyricsCache = createAsyncCache<SyncedLyricsLine[] | null>(
  (uri) => MetalP3Media.getSyncedLyricsAsync(uri).then((result) => result?.lines ?? null),
  null,
);

export function useSyncedLyrics(trackUri: string | null | undefined): SyncedLyricsState {
  const { value, loading } = syncedLyricsCache.useValue(trackUri);
  return { lines: value, loading };
}

export const _resetForTests = syncedLyricsCache._resetForTests;
