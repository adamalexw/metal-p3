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

/** RGB (0-255) -> HSL (h,s,l all 0-1). */
export function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

/** HSL (h,s,l all 0-1) -> RGB (0-255). */
export function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): Rgb {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

/**
 * Lighten `color` until its contrast against `bg` meets `minRatio`, raising
 * HSL lightness while holding hue and saturation. This preserves the source
 * color's character — a deep red stays red instead of washing out toward the
 * grey/white that mixing toward white produces. Most album art is colorful
 * but dark, so the accent seed is a deep swatch that would otherwise need to
 * mix almost all the way to white to clear the contrast bar, collapsing the
 * play button / progress fill to white. Returns white only if even full
 * lightness can't reach the target.
 */
export function lightenForContrast(color: Rgb, bg: Rgb, minRatio: number): Rgb {
  if (contrastRatio(color, bg) >= minRatio) return color;
  const { h, s } = rgbToHsl(color);
  let lo = rgbToHsl(color).l;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const t = (lo + hi) / 2;
    if (contrastRatio(hslToRgb({ h, s, l: t }), bg) >= minRatio) hi = t;
    else lo = t;
  }
  const current = hslToRgb({ h, s, l: hi });
  return contrastRatio(current, bg) >= minRatio ? current : { r: 255, g: 255, b: 255 };
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
