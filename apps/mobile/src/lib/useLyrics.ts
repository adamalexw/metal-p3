import { useEffect, useState } from 'react';
import { MetalP3Media } from '../../modules/metalp3-media';

interface LyricsState {
  text: string | null;
  loading: boolean;
}

const CACHE = new Map<string, string | null>();

export function useLyrics(trackUri: string | null | undefined): LyricsState {
  const [state, setState] = useState<LyricsState>({ text: null, loading: false });

  useEffect(() => {
    if (!trackUri) {
      setState({ text: null, loading: false });
      return;
    }

    if (CACHE.has(trackUri)) {
      setState({ text: CACHE.get(trackUri) ?? null, loading: false });
      return;
    }

    let cancelled = false;
    setState({ text: null, loading: true });

    MetalP3Media.getLyricsAsync(trackUri)
      .then((result) => {
        const text = result?.text ?? null;
        CACHE.set(trackUri, text);
        if (!cancelled) setState({ text, loading: false });
      })
      .catch(() => {
        CACHE.set(trackUri, null);
        if (!cancelled) setState({ text: null, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [trackUri]);

  return state;
}
