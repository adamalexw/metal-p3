import { getLyricsLength } from './apply-lyrics.component';

describe('getLyricsLength', () => {
  it('counts newline-separated lines', () => {
    expect(getLyricsLength('one\ntwo\nthree')).toBe(3);
  });

  it('counts <br /> separated metal-archives lyrics', () => {
    expect(getLyricsLength('one<br />two<br />three')).toBe(3);
    expect(getLyricsLength('one<br>two<br/>three<BR />four')).toBe(4);
  });

  it('handles mixed newline and <br /> separators', () => {
    expect(getLyricsLength('one<br />two\nthree')).toBe(3);
  });

  it('ignores blank lines', () => {
    expect(getLyricsLength('one\n\n<br />two<br /> \n')).toBe(2);
  });

  it('handles CRLF line endings', () => {
    expect(getLyricsLength('one\r\ntwo')).toBe(2);
  });

  it('returns 0 for empty or missing lyrics', () => {
    expect(getLyricsLength('')).toBe(0);
    expect(getLyricsLength(undefined)).toBe(0);
  });
});
