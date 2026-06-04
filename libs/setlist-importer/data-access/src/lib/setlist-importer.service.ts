import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { ImportedSetlist, MatchTracksRequest, ResolvedTrack, ScrapeSetlistsRequest } from '@metal-p3/setlist-importer/domain';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SetlistImporterService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);

  private readonly baseUrl = `${this.api}setlist-importer`;

  scrape(urls: string[]): Observable<ImportedSetlist[]> {
    const body: ScrapeSetlistsRequest = { urls };
    return this.http.post<ImportedSetlist[]>(`${this.baseUrl}/scrape`, body);
  }

  match(setlists: ImportedSetlist[]): Observable<ResolvedTrack[]> {
    const body: MatchTracksRequest = { setlists };
    return this.http.post<ResolvedTrack[]>(`${this.baseUrl}/match`, body);
  }
}
