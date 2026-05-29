import { contrastRatio, ensureContrast, parseHex, toHex, type Rgb } from '../theme/contrast';

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
