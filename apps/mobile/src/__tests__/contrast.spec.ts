import {
  contrastRatio,
  ensureContrast,
  hslToRgb,
  lightenForContrast,
  parseHex,
  rgbToHsl,
  toHex,
  type Rgb,
} from '../theme/contrast';

function hex(value: string): Rgb {
  const result = parseHex(value);
  if (!result) throw new Error(`invalid test hex: ${value}`);
  return result;
}

const black = hex('#000000');
const white = hex('#ffffff');

describe('contrast', () => {
  it('parses 3, 6 and 8 digit hex', () => {
    expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseHex('#112233ff')).toEqual({ r: 0x11, g: 0x22, b: 0x33 });
    expect(parseHex('garbage')).toBeNull();
  });

  it('round-trips hex', () => {
    expect(toHex({ r: 17, g: 34, b: 51 })).toBe('#112233');
  });

  it('computes 21:1 black/white contrast', () => {
    expect(Math.round(contrastRatio(black, white))).toBe(21);
  });

  it('falls back to white on a very dark background when desired fg is too dark', () => {
    const result = ensureContrast(hex('#222222'), black, 4.5);
    expect(toHex(result)).toBe('#ffffff');
  });

  it('keeps desired fg when contrast is already sufficient', () => {
    const result = ensureContrast(hex('#eeeeee'), black, 4.5);
    expect(toHex(result)).toBe('#eeeeee');
  });
});

describe('hsl round-trip', () => {
  it('round-trips primary colors through HSL', () => {
    for (const c of ['#c62828', '#2884c6', '#3fc628', '#9028c6', '#808080']) {
      const back = toHex(hslToRgb(rgbToHsl(hex(c))));
      expect(back).toBe(c);
    }
  });
});

describe('lightenForContrast', () => {
  // Most album art is colorful but dark; the accent seed is a deep swatch.
  // The accent must clear 3:1 against a near-black background WITHOUT washing
  // out to white — otherwise the play button / progress fill look un-themed.
  const darkBg = hex('#141414');

  it('preserves hue while lightening a deep color to meet contrast', () => {
    const seed = hex('#0d3f5e'); // deep teal — would mix to white under the old impl
    const accent = lightenForContrast(seed, darkBg, 3);
    expect(contrastRatio(accent, darkBg)).toBeGreaterThanOrEqual(2.95);
    // Hue stays in the blue range and the result is NOT collapsed to white.
    expect(toHex(accent)).not.toBe('#ffffff');
    const { h, s } = rgbToHsl(accent);
    expect(s).toBeGreaterThan(0.3);
    expect(h).toBeGreaterThan(0.5); // blue/cyan band
    expect(h).toBeLessThan(0.7);
  });

  it('keeps a color that already has enough contrast', () => {
    const seed = hex('#e85a5a');
    expect(lightenForContrast(seed, darkBg, 3)).toEqual(seed);
  });

  it('leaves a near-grey seed grey (no false color)', () => {
    const accent = lightenForContrast(hex('#3a3a3c'), darkBg, 3);
    const { s } = rgbToHsl(accent);
    expect(s).toBeLessThan(0.1);
  });
});
