import type { BandProps, MetalArchivesAlbumTrack, MetalArchivesSearchResponse, MetalArchivesSearchResponseItem } from '@metal-p3/api-interfaces';
import { extractUrl } from '@metal-p3/shared/utils';
import { Injectable } from '@nestjs/common';
import { parse } from 'node-html-parser';
import puppeteer from 'puppeteer-extra';
// import createPuppeteerStealth from 'puppeteer-extra-plugin-stealth';
import { Observable, catchError, from, map, of } from 'rxjs';

@Injectable()
export class MetalArchivesService {
  readonly baseUrl = 'https://www.metal-archives.com/';

  findUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.getApiResponse<MetalArchivesSearchResponse>(
      `${this.baseUrl}search/ajax-advanced/searching/albums/?bandName=${encodeURIComponent(artist)}&releaseTitle=${encodeURIComponent(album)}`,
      'iTotalRecords',
      true,
    ).pipe(
      map((response) => ({ ...response, results: this.mapSearchResults(response.aaData) })),
      catchError((error) => {
        console.log(error);
        return of({
          iTotalRecords: 0,
          aaData: [],
          results: [],
        });
      }),
    );
  }

  private mapSearchResults(
    aaData: {
      0: string;
      1: string;
      2: string;
    }[],
  ): MetalArchivesSearchResponseItem[] {
    return aaData.map((i) => ({
      artistUrl: extractUrl(i[0]) ?? '',
      albumUrl: extractUrl(i[1]) ?? '',
      releaseType: i[2],
    }));
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
    return this.getApiResponse<string>(`${this.baseUrl}release/ajax-view-lyrics/id/${trackId}`, '<br>').pipe(map((htmlLyrics) => parse(htmlLyrics).innerText));
  }

  private getApiResponse<T>(url: string, waitItem: string, isJson = false): Observable<T | string> {
    return from(this.getPageContents<T>(url, 'url', waitItem, isJson)).pipe(
      catchError((err) => {
        console.log(err);
        return of('');
      }),
    );
  }

  private downloadPage(url: string): Observable<string> {
    return from(this.getPageContents<string>(url, 'page', '#MA_logo')).pipe(
      catchError((err) => {
        console.log(err);
        return of('');
      }),
    );
  }

  private async getPageContents<T>(url: string, waitFor: 'page' | 'url', waitItem: string, isJson = false): Promise<T> {
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    const puppeteerStealth = StealthPlugin();

    // const puppeteerStealth = createPuppeteerStealth();
    puppeteerStealth.enabledEvasions.delete('user-agent-override');
    puppeteer.use(puppeteerStealth);

    const browser = await puppeteer.launch({
      headless: false,
      targetFilter: (target) => target.type() !== 'other',
    });
    const defaultPage = (await browser.pages())[0]; // <-- bypasses Cloudflare

    await defaultPage.goto(url);

    if (waitFor === 'url') {
      await defaultPage.waitForFunction(`document.querySelector("body").innerHTML.includes("${waitItem}")`);
      const content = await defaultPage.content();

      if (!isJson) {
        return content;
      }

      const apiResponse = this.extractApiResponse(content);

      return (await JSON.parse(apiResponse)) as T;
    }

    await defaultPage.waitForSelector(waitItem, { timeout: 10000 }).catch((error) => console.error(error));
    const content = await defaultPage.content();

    //await browser.close();
    return content;
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

  private extractApiResponse(content: string) {
    const start = content.indexOf('{');
    const end = content.indexOf('}');

    const json = content
      .substring(start, end + 1)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    return json;
  }
}
