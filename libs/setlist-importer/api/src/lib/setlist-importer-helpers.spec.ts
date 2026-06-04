import { normalizeForMatch, parseSetlistHtml, stripTrackNumber, tokenizeFilename, trackKey } from './setlist-importer-helpers';

describe('setlist-importer-helpers', () => {
  describe('normalizeForMatch', () => {
    it('lowercases and trims', () => {
      expect(normalizeForMatch('  Hello World  ')).toBe('hello world');
    });

    it('normalizes curly quotes', () => {
      expect(normalizeForMatch('Don’t Cry')).toBe("don't cry");
    });

    it('strips punctuation but keeps apostrophes and hyphens', () => {
      expect(normalizeForMatch('Run-DMC: It’s tricky!')).toBe("run-dmc it's tricky");
    });

    it('handles undefined / null', () => {
      expect(normalizeForMatch(undefined)).toBe('');
      expect(normalizeForMatch(null)).toBe('');
    });
  });

  describe('stripTrackNumber', () => {
    it('strips leading "01 - "', () => {
      expect(stripTrackNumber('01 - Aces High.mp3')).toBe('Aces High');
    });

    it('strips leading "01. "', () => {
      expect(stripTrackNumber('01. Aces High.mp3')).toBe('Aces High');
    });

    it('strips leading "01_"', () => {
      expect(stripTrackNumber('01_Aces_High.mp3')).toBe('Aces_High');
    });

    it('leaves files without a leading number alone', () => {
      expect(stripTrackNumber('Aces High.mp3')).toBe('Aces High');
    });

    it('drops the .mp3 extension', () => {
      expect(stripTrackNumber('Aces High.mp3')).not.toContain('.mp3');
    });
  });

  describe('tokenizeFilename', () => {
    it('combines stripTrackNumber + normalizeForMatch', () => {
      expect(tokenizeFilename('01 - Aces High.mp3')).toBe('aces high');
    });
  });

  describe('trackKey', () => {
    it('produces stable keys regardless of casing or whitespace', () => {
      expect(trackKey('Iron Maiden', 'Aces High')).toBe(trackKey('  iron maiden  ', 'aces high'));
    });
  });

  describe('parseSetlistHtml', () => {
    const sourceUrl = 'https://www.setlist.fm/setlist/iron-maiden/2023/utilita-arena-birmingham-england-23a4f9e1.html';

    it('extracts artist, venue, date, and tracks with album hints', () => {
      const html = `
        <html><body>
          <div class="setlistHeadline"><h1><a href="/setlists/iron-maiden">Iron Maiden Setlist</a></h1></div>
          <a class="summary" href="/venue/x"><span>Utilita Arena, Birmingham, England</span></a>
          <div class="dateBlock">
            <span class="dateMonth">Jun</span>
            <span class="dateDay">23</span>
            <span class="dateYear">2023</span>
          </div>
          <ol class="songsList">
            <li class="setlistParts song">
              <div class="songPart"><a href="/song/iron-maiden/aces-high-1.html">Aces High</a></div>
              <div class="infoPart"><span>(from <a href="/album/iron-maiden/powerslave.html">Powerslave</a>)</span></div>
            </li>
            <li class="setlistParts song">
              <div class="songPart"><a href="/song/iron-maiden/the-trooper-1.html">The Trooper</a></div>
              <div class="infoPart"><span>(from <a href="/album/iron-maiden/piece-of-mind.html">Piece of Mind</a>)</span></div>
            </li>
          </ol>
        </body></html>
      `;

      const result = parseSetlistHtml(html, sourceUrl);

      expect(result.id).toBe('23a4f9e1');
      expect(result.url).toBe(sourceUrl);
      expect(result.artist.toLowerCase()).toContain('iron maiden');
      expect(result.venue).toContain('Birmingham');
      expect(result.date).toBe('Jun 23 2023');
      expect(result.tracks).toHaveLength(2);
      expect(result.tracks[0]).toMatchObject({ title: 'Aces High', hintedAlbum: 'Powerslave' });
      expect(result.tracks[0].songPageUrl).toContain('/song/iron-maiden/aces-high-1.html');
      expect(result.tracks[1]).toMatchObject({ title: 'The Trooper', hintedAlbum: 'Piece of Mind' });
    });

    it('still extracts tracks when album hints are missing', () => {
      const html = `
        <html><body>
          <div class="setlistHeadline"><h1>Some Band Setlist</h1></div>
          <ol class="songsList">
            <li class="setlistParts song">
              <div class="songPart"><a href="/song/some-band/intro-1.html">Intro</a></div>
            </li>
          </ol>
        </body></html>
      `;

      const result = parseSetlistHtml(html, sourceUrl);

      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0]).toMatchObject({ title: 'Intro', hintedAlbum: undefined });
    });

    it('returns an empty track list when no songs are present', () => {
      const html = `<html><body><div class="setlistHeadline"><h1>Empty</h1></div></body></html>`;
      const result = parseSetlistHtml(html, sourceUrl);
      expect(result.tracks).toEqual([]);
    });
  });
});
