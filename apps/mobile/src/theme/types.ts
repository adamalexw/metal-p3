export interface ArtworkTheme {
  /** Dark base color suitable as a screen background. */
  background: string;
  /** Slightly lighter surface for cards/buttons. */
  surface: string;
  /** Primary text color, WCAG AA against `background`. */
  foreground: string;
  /** Secondary text color, lower contrast but still readable. */
  mutedForeground: string;
  /** Accent (play button background, progress fill, etc). */
  accent: string;
  /** Text/icon color to use on `accent`. */
  accentForeground: string;
  /** data:... URI for the current artwork, or null if none. */
  artworkDataUri: string | null;
  /** True while the artwork is being fetched / colors extracted. */
  loading: boolean;
}

export const DEFAULT_THEME: ArtworkTheme = {
  background: '#000000',
  surface: '#1a1a1a',
  foreground: '#ffffff',
  mutedForeground: '#a0a0a0',
  accent: '#ffffff',
  accentForeground: '#000000',
  artworkDataUri: null,
  loading: false,
};
