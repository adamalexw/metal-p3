import { useEffect, useRef, useState } from 'react';
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
      // file:// URI (not a data: URI) so expo-image disk-caches it and can
      // reload after the OS evicts its memory bitmap on lock/unlock.
      const value = art ? art.fileUri : null;
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

/**
 * Batch-resolves artwork for a list of uris at the parent level so a long
 * list (queue, search results) only fires one native load per fresh uri,
 * not one per visible row. Returns a Map keyed by uri so callers can pass
 * primitives down to memoized row components.
 */
export function useQueueArtwork(uris: ReadonlyArray<string>): Map<string, string | null> {
  // Stable key that changes when the unique-uri set changes. The queue
  // typically contains tens of items so JSON-stringifying the joined uri
  // list is cheap and avoids re-creating the effect for cosmetic reorders
  // that don't add new uris.
  const uniqueUris = useMemoUniqueUris(uris);

  const [resolved, setResolved] = useState<Map<string, string | null>>(() => {
    const m = new Map<string, string | null>();
    for (const u of uniqueUris) m.set(u, getCachedTrackArtwork(u));
    return m;
  });

  useEffect(() => {
    let cancelled = false;
    // Seed from the cache up-front so any uri the cache already knows about
    // shows immediately, then fire loads only for the unresolved ones.
    const next = new Map<string, string | null>();
    const toLoad: string[] = [];
    for (const u of uniqueUris) {
      if (ARTWORK_CACHE.has(u)) {
        next.set(u, ARTWORK_CACHE.get(u) ?? null);
      } else {
        next.set(u, null);
        toLoad.push(u);
      }
    }
    setResolved(next);

    if (toLoad.length === 0) return;
    void Promise.all(
      toLoad.map((u) => loadTrackArtwork(u).then((value) => ({ u, value }))),
    ).then((results) => {
      if (cancelled) return;
      setResolved((prev) => {
        let changed = false;
        const merged = new Map(prev);
        for (const { u, value } of results) {
          if (merged.get(u) !== value) {
            merged.set(u, value);
            changed = true;
          }
        }
        return changed ? merged : prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [uniqueUris]);

  return resolved;
}

/**
 * Memoizes the deduped uri array by joined-key so the effect downstream
 * only re-runs when the *set* of uris changes, not when the list reorders.
 */
function useMemoUniqueUris(uris: ReadonlyArray<string>): string[] {
  const key = uris.join('|');
  return useMemoByKey(key, () => Array.from(new Set(uris)));
}

function useMemoByKey<T>(key: string, factory: () => T): T {
  const cache = useRef<{ key: string; value: T } | null>(null);
  if (cache.current === null || cache.current.key !== key) {
    cache.current = { key, value: factory() };
  }
  return cache.current.value;
}
