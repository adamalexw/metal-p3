import { MetalP3Player } from '../../modules/metalp3-player';
import type { Track } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { prefetchArtworkTheme } from '../theme/useArtworkTheme';
import { errorMessage } from './error-message';
import { shuffled } from './shuffle';
import { toQueueItem } from './to-queue-item';

export type StartQueueResult = { ok: true } | { ok: false; message: string };

export async function startQueue(tracks: Track[], startIndex = 0): Promise<StartQueueResult> {
  prefetchArtworkTheme(tracks[startIndex]?.uri);
  try {
    await MetalP3Player.setShuffle(false);
    await MetalP3Player.setQueueAsync(tracks.map(toQueueItem), startIndex, 0);
    await MetalP3Player.play();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: errorMessage(err) };
  }
}

export async function startShuffled(tracks: Track[]): Promise<StartQueueResult> {
  const ordered = shuffled(tracks);
  prefetchArtworkTheme(ordered[0]?.uri);
  try {
    await MetalP3Player.setQueueAsync(ordered.map(toQueueItem), 0, 0);
    await MetalP3Player.setShuffle(true);
    await MetalP3Player.play();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: errorMessage(err) };
  }
}
