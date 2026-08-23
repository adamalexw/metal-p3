import { useEffect, useState } from 'react';

export interface AsyncCacheValue<T> {
  value: T;
  loading: boolean;
}

export interface AsyncCache<T> {
  /** Cached value for the key, loading on first use. `empty` while absent. */
  useValue(key: string | null | undefined): AsyncCacheValue<T>;
  /** Resolves the value, deduping concurrent loads for the same key. */
  load(key: string): Promise<T>;
  _resetForTests(): void;
}

/**
 * Shared per-key cache for async native lookups (extras, lyrics, …). One load
 * per key for the app's lifetime; concurrent consumers share the in-flight
 * promise instead of firing duplicate native calls. Failures cache `empty` so
 * a bad file isn't re-read on every mount.
 */
export function createAsyncCache<T>(loadFn: (key: string) => Promise<T>, empty: T): AsyncCache<T> {
  const cache = new Map<string, T>();
  const inflight = new Map<string, Promise<T>>();

  function load(key: string): Promise<T> {
    if (cache.has(key)) return Promise.resolve(cache.get(key) as T);
    const existing = inflight.get(key);
    if (existing) return existing;
    const promise = loadFn(key)
      .then((value) => {
        cache.set(key, value);
        return value;
      })
      .catch(() => {
        cache.set(key, empty);
        return empty;
      })
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, promise);
    return promise;
  }

  function useValue(key: string | null | undefined): AsyncCacheValue<T> {
    const [state, setState] = useState<AsyncCacheValue<T>>(() =>
      key && cache.has(key)
        ? { value: cache.get(key) as T, loading: false }
        : { value: empty, loading: false },
    );

    useEffect(() => {
      if (!key) {
        setState({ value: empty, loading: false });
        return;
      }
      if (cache.has(key)) {
        setState({ value: cache.get(key) as T, loading: false });
        return;
      }

      let cancelled = false;
      setState({ value: empty, loading: true });
      void load(key).then((value) => {
        if (!cancelled) setState({ value, loading: false });
      });
      return () => {
        cancelled = true;
      };
    }, [key]);

    return state;
  }

  return {
    useValue,
    load,
    _resetForTests: () => {
      cache.clear();
      inflight.clear();
    },
  };
}
