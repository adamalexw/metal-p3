import type { BandProps, MetalArchivesAlbumTrack, MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { extractBandProps, extractTracks, mapSearchResults } from './metal-archives-helpers';

@Injectable()
export class MetalArchivesService {
  private readonly baseUrl = 'https://www.metal-archives.com/';

  constructor(private readonly httpService: HttpService) {}

  findUrl(artist: string, album: string): Observable<MetalArchivesSearchResponse> {
    return this.httpService
      .get<MetalArchivesSearchResponse>(`${this.baseUrl}search/ajax-advanced/searching/albums/?bandName=${encodeURIComponent(artist)}&releaseTitle=${encodeURIComponent(album)}`)
      .pipe(
        map((response) => response.data),
        map((response) => ({ ...response, results: mapSearchResults(response.aaData) })),
      );
  }

  getTracks(url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.downloadPage(url).pipe(map((html) => extractTracks(html)));
  }

  getLyrics(trackId: string): Observable<string> {
    return this.httpService.get<string>(`${this.baseUrl}release/ajax-view-lyrics/id/${trackId}`).pipe(map((response) => response.data.trim()));
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.downloadPage(url).pipe(map((html) => extractBandProps(html)));
  }

  private downloadPage(url: string): Observable<string> {
    return this.httpService.get<string>(url).pipe(map((response) => response.data));
  }
}
