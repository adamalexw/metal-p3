import type { BandProps, MetalArchivesAlbumTrack, MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { Injectable } from '@nestjs/common';
import { parse } from 'node-html-parser';
import puppeteer from 'puppeteer-extra';
// import createPuppeteerStealth from 'puppeteer-extra-plugin-stealth';
import { Observable, catchError, from, map, of } from 'rxjs';
import { extractBandProps, extractTracks, mapSearchResults } from './metal-archives-helpers';

@Injectable()
export class MetalArchivesService {
  readonly baseUrl = 'https://www.metal-archives.com/';

  findUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.getApiResponse<MetalArchivesSearchResponse>(
      `${this.baseUrl}search/ajax-advanced/searching/albums/?bandName=${encodeURIComponent(artist)}&releaseTitle=${encodeURIComponent(album)}`,
      'iTotalRecords',
      true,
    ).pipe(
      map((response) => ({ ...response, results: mapSearchResults(response.aaData) })),
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

  getTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.downloadPage(url).pipe(map((html) => extractTracks(html)));
  }

  getLyrics(trackId: string): Observable<string> {
    return this.getApiResponse<string>(`${this.baseUrl}release/ajax-view-lyrics/id/${trackId}`, '<br>').pipe(map((htmlLyrics) => parse(htmlLyrics).innerText));
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.downloadPage(url).pipe(map((html) => extractBandProps(html)));
  }

  private getApiResponse<T>(url: string, waitItem: string, isJson = false): Observable<T> {
    return from(this.getPageContents<T>(url, 'url', waitItem, isJson)).pipe(
      catchError((err) => {
        console.log(err);
        return of('' as T);
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
        return content as T;
      }

      const apiResponse = this.extractApiResponse(content);

      return (await JSON.parse(apiResponse)) as T;
    }

    await defaultPage.waitForSelector(waitItem, { timeout: 10000 }).catch((error) => console.error(error));
    const content = await defaultPage.content();

    //await browser.close();
    return content as T;
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
