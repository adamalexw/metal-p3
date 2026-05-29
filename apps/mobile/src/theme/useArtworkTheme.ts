import { useEffect, useState } from 'react';
import { getColors } from 'react-native-image-colors';
import type { AndroidImageColors } from 'react-native-image-colors/build/types';
import { MetalP3Media } from '../../modules/metalp3-media';
import {
  bestMonoFor,
  clampLuminanceDown,
  contrastRatio,
  ensureContrast,
  luminance,
  parseHex,
  toHex,
  type Rgb,
} from './contrast';
import { DEFAULT_THEME, type ArtworkTheme } from './types';

const ARTWORK_CACHE = new Map<string, string | null>();
const THEME_CACHE = new Map<string, ArtworkTheme>();

async function fetchArtworkDataUri(trackUri: string): Promise<string | null> {
  if (ARTWORK_CACHE.has(trackUri)) return ARTWORK_CACHE.get(trackUri) ?? null;
  const art = await MetalP3Media.getArtworkAsync(trackUri);
  const value = art ? `data:${art.mimeType};base64,${art.base64}` : null;
  ARTWORK_CACHE.set(trackUri, value);
  return value;
}

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

  const accentSeed = vibrant ?? lightVibrant ?? fgSeed;
  const accent = contrastRatio(accentSeed, background) >= 3 ? accentSeed : ensureContrast(accentSeed, background, 3);
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

export function useArtworkTheme(trackUri: string | null | undefined): ArtworkTheme {
  const [theme, setTheme] = useState<ArtworkTheme>(DEFAULT_THEME);

  useEffect(() => {
    if (!trackUri) {
      setTheme(DEFAULT_THEME);
      return;
    }

    const cached = THEME_CACHE.get(trackUri);
    if (cached) {
      setTheme(cached);
      return;
    }

    let cancelled = false;
    setTheme((t) => ({ ...t, loading: true }));

    (async () => {
      try {
        const dataUri = await fetchArtworkDataUri(trackUri);
        if (!dataUri) {
          if (!cancelled) setTheme({ ...DEFAULT_THEME });
          return;
        }
        const result = await getColors(dataUri, { cache: true, key: trackUri });
        if (result.platform !== 'android') {
          if (!cancelled) setTheme({ ...DEFAULT_THEME, artworkDataUri: dataUri });
          return;
        }
        const next = paletteToTheme(result, dataUri);
        THEME_CACHE.set(trackUri, next);
        if (!cancelled) setTheme(next);
      } catch {
        if (!cancelled) setTheme(DEFAULT_THEME);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trackUri]);

  return theme;
}
