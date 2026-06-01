import { useEffect, useState } from 'react';
import { MetalP3Media } from '../../modules/metalp3-media';
import type { TrackExtras } from '../../modules/metalp3-media/src/MetalP3Media.types';

const EMPTY: TrackExtras = { country: null, metalArchivesUrl: null };
const CACHE = new Map<string, TrackExtras>();

export function useTrackExtras(trackUri: string | null | undefined): TrackExtras {
  const [state, setState] = useState<TrackExtras>(() =>
    trackUri && CACHE.has(trackUri) ? (CACHE.get(trackUri) as TrackExtras) : EMPTY,
  );

  useEffect(() => {
    if (!trackUri) {
      setState(EMPTY);
      return;
    }

    const cached = CACHE.get(trackUri);
    if (cached) {
      setState(cached);
      return;
    }

    let cancelled = false;
    MetalP3Media.getExtrasAsync(trackUri)
      .then((result) => {
        const next: TrackExtras = result ?? EMPTY;
        CACHE.set(trackUri, next);
        if (!cancelled) setState(next);
      })
      .catch(() => {
        CACHE.set(trackUri, EMPTY);
        if (!cancelled) setState(EMPTY);
      });

    return () => {
      cancelled = true;
    };
  }, [trackUri]);

  return state;
}
