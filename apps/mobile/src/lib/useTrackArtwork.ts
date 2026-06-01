import { useEffect, useState } from 'react';
import { MetalP3Media } from '../../modules/metalp3-media';

const ARTWORK_CACHE = new Map<string, string | null>();
const INFLIGHT = new Map<string, Promise<string | null>>();

export function getCachedTrackArtwork(uri: string | null | undefined): string | null {
  if (!uri) return null;
  return ARTWORK_CACHE.get(uri) ?? null;
}

export async function loadTrackArtwork(uri: string): Promise<string | null> {
  if (ARTWORK_CACHE.has(uri)) return ARTWORK_CACHE.get(uri) ?? null;
  const existing = INFLIGHT.get(uri);
  if (existing) return existing;
  const promise = MetalP3Media.getArtworkAsync(uri)
    .then((art) => {
      const value = art ? `data:${art.mimeType};base64,${art.base64}` : null;
      ARTWORK_CACHE.set(uri, value);
      return value;
    })
    .catch(() => {
      ARTWORK_CACHE.set(uri, null);
      return null;
    })
    .finally(() => {
      INFLIGHT.delete(uri);
    });
  INFLIGHT.set(uri, promise);
  return promise;
}

/**
 * Returns the cached data URI for a track's embedded artwork, fetching on
 * demand. Shared cache across all consumers — only one native load per uri
 * for the lifetime of the app.
 */
export function useTrackArtwork(uri: string | null | undefined): string | null {
  const [dataUri, setDataUri] = useState<string | null>(() =>
    uri ? getCachedTrackArtwork(uri) : null,
  );

  useEffect(() => {
    if (!uri) {
      setDataUri(null);
      return;
    }
    const cached = getCachedTrackArtwork(uri);
    if (cached !== null || ARTWORK_CACHE.has(uri)) {
      setDataUri(cached);
      return;
    }
    let cancelled = false;
    void loadTrackArtwork(uri).then((value) => {
      if (!cancelled) setDataUri(value);
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return dataUri;
}

export function _resetForTests(): void {
  ARTWORK_CACHE.clear();
  INFLIGHT.clear();
}
