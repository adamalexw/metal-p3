import { useEffect, useState } from 'react';
import { getColors } from 'react-native-image-colors';
import type { AndroidImageColors } from 'react-native-image-colors/build/types';
import { loadTrackArtwork, evictTrackArtwork } from '../lib/useTrackArtwork';
import {
  bestMonoFor,
  clampLuminanceDown,
  ensureContrast,
  lightenForContrast,
  luminance,
  parseHex,
  toHex,
  type Rgb,
} from './contrast';

function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return 0;
  return (max - min) / max;
}

function pickMostSaturated(candidates: Array<Rgb | null>): Rgb | null {
  const valid = candidates.filter((c): c is Rgb => c !== null && saturation(c) > 0.12);
  if (valid.length === 0) return null;
  return valid.reduce((best, c) => (saturation(c) > saturation(best) ? c : best));
}
import { DEFAULT_THEME, type ArtworkTheme } from './types';

const THEME_CACHE = new Map<string, ArtworkTheme>();

/**
 * Build a theme from an Android Palette result, guaranteeing WCAG AA contrast
 * for foreground (4.5:1) and at least AA-large (3:1) for the accent.
 */
function paletteToTheme(p: AndroidImageColors, artworkDataUri: string): ArtworkTheme {
  const dominant = parseHex(p.dominant);
  const darkMuted = parseHex(p.darkMuted);
  const darkVibrant = parseHex(p.darkVibrant);
  const lightVibrant = parseHex(p.lightVibrant);
  const lightMuted = parseHex(p.lightMuted);
  const vibrant = parseHex(p.vibrant);
  const muted = parseHex(p.muted);

  const candidates = [darkVibrant, darkMuted, dominant].filter(Boolean) as Rgb[];
  const seed = candidates.sort((a, b) => luminance(a) - luminance(b))[0] ?? { r: 16, g: 16, b: 16 };
  const background = clampLuminanceDown(seed, 0.06);

  const surface = clampLuminanceDown(seed, 0.14);

  const fgSeed = lightVibrant ?? lightMuted ?? { r: 255, g: 255, b: 255 };
  const foreground = ensureContrast(fgSeed, background, 4.5);
  const mutedForeground = ensureContrast(
    { r: foreground.r * 0.7, g: foreground.g * 0.7, b: foreground.b * 0.7 },
    background,
    3.0,
  );

  const accentSeed =
    pickMostSaturated([vibrant, lightVibrant, darkVibrant, lightMuted, muted, darkMuted, dominant])
    ?? fgSeed;
  const accent = lightenForContrast(accentSeed, background, 3);
  const accentForeground = bestMonoFor(accent);

  return {
    background: toHex(background),
    surface: toHex(surface),
    foreground: toHex(foreground),
    mutedForeground: toHex(mutedForeground),
    accent: toHex(accent),
    accentForeground: toHex(accentForeground),
    artworkDataUri,
    loading: false,
  };
}

async function loadArtworkTheme(trackUri: string): Promise<ArtworkTheme> {
  const cached = THEME_CACHE.get(trackUri);
  if (cached) return cached;

  let dataUri: string | null = null;
  try {
    dataUri = await loadTrackArtwork(trackUri);
    if (!dataUri) return { ...DEFAULT_THEME };
    const result = await getColors(dataUri, { cache: true, key: trackUri });
    if (result.platform !== 'android') {
      return { ...DEFAULT_THEME, artworkDataUri: dataUri };
    }
    const next = paletteToTheme(result, dataUri);
    THEME_CACHE.set(trackUri, next);
    return next;
  } catch {
    return { ...DEFAULT_THEME, artworkDataUri: dataUri };
  }
}

/**
 * Fire-and-forget warmer used right before navigating to the player screen.
 * Why: extracting the embedded picture + palette takes long enough to leave a
 * visible "placeholder → artwork" pop on cold play. Pre-populating the caches
 * while the queue is being set means the player can paint the final theme on
 * its first render.
 */
export function prefetchArtworkTheme(trackUri: string | null | undefined): void {
  if (!trackUri) return;
  if (THEME_CACHE.has(trackUri)) return;
  void loadArtworkTheme(trackUri).catch(() => {
    // Swallow — the hook will retry and surface the failure if it still matters.
  });
}

const THEME_LISTENERS = new Set<(uri: string) => void>();

export function subscribeTheme(listener: (uri: string) => void): () => void {
  THEME_LISTENERS.add(listener);
  return () => {
    THEME_LISTENERS.delete(listener);
  };
}

export function evictArtworkTheme(trackUri: string): void {
  THEME_CACHE.delete(trackUri);
  evictTrackArtwork(trackUri);
  for (const listener of THEME_LISTENERS) {
    listener(trackUri);
  }
}

export function useArtworkTheme(trackUri: string | null | undefined): ArtworkTheme {
  const [prevTrackUri, setPrevTrackUri] = useState<string | null | undefined>(trackUri);
  const [theme, setTheme] = useState<ArtworkTheme>(() => {
    if (!trackUri) return DEFAULT_THEME;
    return THEME_CACHE.get(trackUri) ?? DEFAULT_THEME;
  });

  let currentTheme = theme;
  if (trackUri !== prevTrackUri) {
    setPrevTrackUri(trackUri);
    const cached = trackUri ? THEME_CACHE.get(trackUri) : null;
    if (cached) {
      currentTheme = cached;
      setTheme(cached);
    } else {
      currentTheme = trackUri ? { ...theme, loading: true } : DEFAULT_THEME;
      setTheme(currentTheme);
    }
  }

  useEffect(() => {
    if (!trackUri) {
      setTheme(DEFAULT_THEME);
      return;
    }

    let cancelled = false;
    const update = () => {
      if (!cancelled) {
        setTheme(THEME_CACHE.get(trackUri) ?? DEFAULT_THEME);
      }
    };

    if (!THEME_CACHE.has(trackUri)) {
      setTheme((t) => ({ ...t, loading: true }));
      void loadArtworkTheme(trackUri).then(() => {
        update();
      });
    } else {
      update();
    }

    const unsubscribe = subscribeTheme((evictedUri) => {
      if (evictedUri === trackUri && !cancelled) {
        setTheme((t) => ({ ...t, loading: true }));
        void loadArtworkTheme(trackUri).then(() => {
          update();
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [trackUri]);

  return currentTheme;
}
