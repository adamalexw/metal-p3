import { BandProps, MetalArchivesAlbumTrack, MetalArchivesSearchResponseItem } from '@metal-p3/api-interfaces';
import { extractUrl } from '@metal-p3/shared/utils';
import { parse } from 'node-html-parser';

export const mapSearchResults = (
  aaData: {
    0: string;
    1: string;
    2: string;
  }[],
): MetalArchivesSearchResponseItem[] => {
  return aaData.map((i) => ({
    artistUrl: extractUrl(i[0]) ?? '',
    albumUrl: extractUrl(i[1]) ?? '',
    releaseType: i[2],
  }));
};

export const extractTracks = (html: string): MetalArchivesAlbumTrack[] => {
  const tracks: MetalArchivesAlbumTrack[] = [];

  const root = parse(html);

  const lyricsTable = root.querySelector('.table_lyrics');
  const rows = lyricsTable.querySelectorAll('tr');

  if (rows.length) {
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const tds = row.querySelectorAll('td');

      if (tds.length > 3) {
        const track: MetalArchivesAlbumTrack = { id: '', hasLyrics: false };
        for (let i = 0; i < tds.length; i++) {
          const td = tds[i];

          switch (i) {
            case 0:
              track.id = td.querySelector('a')?.getAttribute('name') || '';
              track.trackNumber = td.textContent.trim().replace('.', '').padStart(2, '0');
              break;
            case 1:
              track.title = td.textContent.replace(/\n/g, '').trim();
              break;
            case 2:
              track.duration = td.textContent;
              break;
            case 3:
              track.hasLyrics = td.textContent.includes('Show lyrics');
              break;
          }
        }

        if (track.id) {
          tracks.push(track);
        }
      }
    }
  }

  return tracks;
};

export const extractBandProps = (html: string): BandProps => {
  const props: BandProps = {
    country: '',
    genre: '',
  };

  const root = parse(html);

  const statsTable = root.querySelector('#band_stats');
  const row1 = statsTable.querySelector('dl.float_left');
  const row2 = statsTable.querySelector('dl.float_right');

  props.country = row1.querySelector('dd > a').textContent;
  props.genre = row2.querySelector('dd').textContent.replace(/\//g, ' - ');

  return props;
};
