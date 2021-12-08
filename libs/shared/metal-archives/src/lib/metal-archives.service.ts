import { BandProps, MetalArchivesAlbumTrack, MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { parse } from 'node-html-parser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MetalArchivesService {
  readonly baseUrl = 'https://www.metal-archives.com/';

  constructor(private readonly httpService: HttpService) {}

  findUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.httpService
      .get<MetalArchivesSearchResponse>(`${this.baseUrl}search/ajax-advanced/searching/albums/?bandName=${encodeURIComponent(artist)}&releaseTitle=${encodeURIComponent(album)}`)
      .pipe(map((response) => response.data));
  }

  getTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.downloadPage(url).pipe(map((html) => this.extractTracks(html)));
  }

  private extractTracks(html: string): MetalArchivesAlbumTrack[] {
    const tracks: MetalArchivesAlbumTrack[] = [];

    const root = parse(html);

    const lyricsTable = root.querySelector('.table_lyrics');
    const rows = lyricsTable.querySelectorAll('tr');

    if (rows.length) {
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const tds = row.querySelectorAll('td');

        if (tds.length) {
          const track: MetalArchivesAlbumTrack = { id: 0, hasLyrics: false };
          for (let i = 0; i < tds.length; i++) {
            const td = tds[i];

            switch (i) {
              case 0:
                track.id = +(td.querySelector('a')?.getAttribute('name') || 0);
                track.trackNumber = td.textContent.replace('.', '');
                break;
              case 1:
                track.title = td.textContent.replace(/\n/g, '');
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
  }

  getLyrics(trackId: string): Observable<string> {
    return this.httpService.get<string>(`${this.baseUrl}release/ajax-view-lyrics/id/${trackId}`).pipe(map((response) => response.data.trim()));
  }

  private downloadPage(url: string): Observable<string> {
    return this.httpService.get<string>(url).pipe(map((response) => response.data));
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.downloadPage(url).pipe(map((html) => this.extractBandProps(html)));
  }

  private extractBandProps(html: string): BandProps {
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
  }
}
