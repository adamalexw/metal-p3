import { AppState } from 'react-native';
import { MetalP3Player, type PlaybackState } from '../../modules/metalp3-player';
import { prefetchArtworkTheme, repairArtworkTheme } from '../theme/useArtworkTheme';

let started = false;

/**
 * Subscribes once for the lifetime of the app and warms the artwork +
 * palette cache for the *next* track on every state change. Why: the
 * player paints text from `current` immediately, but artwork has to be
 * read from the file and palette-extracted — without this prefetch,
 * users see a visible delay where the title shows up before the cover.
 * By the time skipToNext fires, the next track's theme is already cached
 * and `useArtworkTheme` paints it on the first render.
 *
 * Also revalidates on foreground: artwork reads that ran while the device
 * was locked can fail (content:// access from a backgrounded process) and
 * poison the caches with nulls that would otherwise stick until the track
 * changes. Foreground reads succeed, so repairing here fixes the artwork
 * the moment the user unlocks.
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

  AppState.addEventListener('change', (appState) => {
    if (appState !== 'active') return;
    repairArtworkTheme(lastCurrentUri);
    repairArtworkTheme(lastNextUri);
  });
}
