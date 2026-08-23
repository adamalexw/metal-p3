import { MetalP3Media } from '../../modules/metalp3-media';
import { createAsyncCache } from './async-cache';

interface LyricsState {
  text: string | null;
  loading: boolean;
}

const lyricsCache = createAsyncCache<string | null>(
  (uri) => MetalP3Media.getLyricsAsync(uri).then((result) => result?.text ?? null),
  null,
);

export function useLyrics(trackUri: string | null | undefined): LyricsState {
  const { value, loading } = lyricsCache.useValue(trackUri);
  return { text: value, loading };
}

export const _resetForTests = lyricsCache._resetForTests;
