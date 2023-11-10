import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { createToObjectUrl, mapBlobToBase64 } from '@metal-p3/shared/utils';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CoverService {
  readonly baseUrl = `${this.api}cover`;

  constructor(private readonly http: HttpClient, @Inject(API) private readonly api: string) {}

  getCover(location: string): Observable<string> {
    return this.http.get(`${this.baseUrl}?location=${encodeURIComponent(location)}`, { responseType: 'text' }).pipe(map(createToObjectUrl));
  }

  downloadCover(url: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/download?url=${encodeURIComponent(url)}`, { responseType: 'text' }).pipe(map(createToObjectUrl));
  }

  getCoverDto(blobUrl: string): Observable<unknown> {
    return this.http.get(blobUrl, { responseType: 'blob' }).pipe(switchMap((blob) => mapBlobToBase64(blob)));
  }

  saveCover(folder: string, cover: string): Observable<never> {
    return this.http.post<never>(this.baseUrl, { folder, cover });
  }
}
