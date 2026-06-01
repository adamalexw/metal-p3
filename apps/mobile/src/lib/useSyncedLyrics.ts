import { useEffect, useState } from 'react';
import { MetalP3Media, type SyncedLyricsLine } from '../../modules/metalp3-media';

interface SyncedLyricsState {
  lines: SyncedLyricsLine[] | null;
  loading: boolean;
}

const CACHE = new Map<string, SyncedLyricsLine[] | null>();

export function useSyncedLyrics(trackUri: string | null | undefined): SyncedLyricsState {
  const [state, setState] = useState<SyncedLyricsState>({ lines: null, loading: false });

  useEffect(() => {
    if (!trackUri) {
      setState({ lines: null, loading: false });
      return;
    }

    if (CACHE.has(trackUri)) {
      setState({ lines: CACHE.get(trackUri) ?? null, loading: false });
      return;
    }

    let cancelled = false;
    setState({ lines: null, loading: true });

    MetalP3Media.getSyncedLyricsAsync(trackUri)
      .then((result) => {
        const lines = result?.lines ?? null;
        CACHE.set(trackUri, lines);
        if (!cancelled) setState({ lines, loading: false });
      })
      .catch(() => {
        CACHE.set(trackUri, null);
        if (!cancelled) setState({ lines: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [trackUri]);

  return state;
}
