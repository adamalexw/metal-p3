import { MetalP3Media } from '../../modules/metalp3-media';
import type { TrackExtras } from '../../modules/metalp3-media/src/MetalP3Media.types';
import { createAsyncCache } from './async-cache';

const EMPTY: TrackExtras = { country: null, metalArchivesUrl: null };

const extrasCache = createAsyncCache<TrackExtras>(
  (uri) => MetalP3Media.getExtrasAsync(uri).then((result) => result ?? EMPTY),
  EMPTY,
);

export function useTrackExtras(trackUri: string | null | undefined): TrackExtras {
  return extrasCache.useValue(trackUri).value;
}

export const _resetForTests = extrasCache._resetForTests;
