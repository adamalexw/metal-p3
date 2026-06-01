import { MetalP3Player, type PlaybackState } from '../../modules/metalp3-player';
import { prefetchArtworkTheme } from '../theme/useArtworkTheme';

let started = false;

/**
 * Subscribes once for the lifetime of the app and warms the artwork +
 * palette cache for the *next* track on every state change. Why: the
 * player paints text from `current` immediately, but artwork has to be
 * read from the file and palette-extracted — without this prefetch,
 * users see a visible delay where the title shows up before the cover.
 * By the time skipToNext fires, the next track's theme is already cached
 * and `useArtworkTheme` paints it on the first render.
 */
export function startArtworkPrefetcher(): void {
  if (started) return;
  started = true;

  let lastNextUri: string | null = null;
  let lastCurrentUri: string | null = null;

  const onState = (state: PlaybackState) => {
    const currentUri = state.current?.uri ?? null;
    if (currentUri && currentUri !== lastCurrentUri) {
      lastCurrentUri = currentUri;
      prefetchArtworkTheme(currentUri);
    }

    const queue = state.queue ?? [];
    const idx = state.currentIndex;
    const nextUri = idx >= 0 && idx + 1 < queue.length ? queue[idx + 1]?.uri ?? null : null;
    if (nextUri && nextUri !== lastNextUri) {
      lastNextUri = nextUri;
      prefetchArtworkTheme(nextUri);
    }
  };

  MetalP3Player.getStateAsync().then(onState).catch(() => undefined);
  MetalP3Player.addStateListener(onState);
}
