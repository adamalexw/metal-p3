export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string | null | undefined): Rgb | null {
  if (!hex) return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG contrast ratio, range 1.0 (no contrast) to 21.0 (black/white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mix two colors. t=0 -> a, t=1 -> b. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

/** Darken `color` toward black until its luminance is at or below `targetLuminance`. */
export function clampLuminanceDown(color: Rgb, targetLuminance: number): Rgb {
  let lo = 0;
  let hi = 1;
  let current = color;
  for (let i = 0; i < 12; i++) {
    const t = (lo + hi) / 2;
    current = mix(color, { r: 0, g: 0, b: 0 }, t);
    if (luminance(current) > targetLuminance) lo = t;
    else hi = t;
  }
  return current;
}

/**
 * Return whichever of black or white gives the larger contrast against `bg`.
 * Used as the safe fallback for foreground text on an arbitrary background.
 */
export function bestMonoFor(bg: Rgb): Rgb {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };
  return contrastRatio(bg, white) >= contrastRatio(bg, black) ? white : black;
}

/**
 * Given a desired foreground `fg` and a background `bg`, return `fg` if the
 * contrast is at least `minRatio`; otherwise fall back to the best
 * black/white choice for `bg`. WCAG AA = 4.5 for normal text, 3.0 for large.
 */
export function ensureContrast(fg: Rgb, bg: Rgb, minRatio = 4.5): Rgb {
  return contrastRatio(fg, bg) >= minRatio ? fg : bestMonoFor(bg);
}
