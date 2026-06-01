import { stripLrcTimestamps } from './lyrics.component';

describe('stripLrcTimestamps', () => {
  it('removes leading [mm:ss.xx] timestamps', () => {
    const input = '[00:01.50] line one\n[00:05.00] line two';
    expect(stripLrcTimestamps(input)).toBe('line one\nline two');
  });

  it('removes [mm:ss] timestamps without milliseconds', () => {
    expect(stripLrcTimestamps('[00:01] hello')).toBe('hello');
  });

  it('drops metadata-only lines', () => {
    const input = '[ar: Iron Maiden]\n[ti: The Trooper]\n[al: Piece of Mind]\n[length: 04:11]\n[00:00.00] Steady\n[00:01.00] As she goes';
    expect(stripLrcTimestamps(input)).toBe('Steady\nAs she goes');
  });

  it('preserves blank lines', () => {
    expect(stripLrcTimestamps('[00:00.00] one\n\n[00:02.00] two')).toBe('one\n\ntwo');
  });

  it('passes through lines without timestamps', () => {
    expect(stripLrcTimestamps('plain line\nanother')).toBe('plain line\nanother');
  });

  it('handles CRLF line endings', () => {
    expect(stripLrcTimestamps('[00:01.00] one\r\n[00:02.00] two')).toBe('one\ntwo');
  });

  it('returns an empty string for empty input', () => {
    expect(stripLrcTimestamps('')).toBe('');
  });
});
