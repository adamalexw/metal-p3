import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { createToObjectUrl, mapBlobToBase64 } from '@metal-p3/shared/utils';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CoverService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);

  private readonly baseUrl = `${this.api}cover`;

  getCover(location: string): Observable<string> {
    return this.http.get(`${this.baseUrl}?location=${encodeURIComponent(location)}`, { responseType: 'text' }).pipe(map(createToObjectUrl));
  }

  downloadCover(url: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/download?url=${encodeURIComponent(url)}`, { responseType: 'text' }).pipe(map(createToObjectUrl));
  }

  getCoverDto(blobUrl: string): Observable<unknown> {
    return this.http.get(blobUrl, { responseType: 'blob' }).pipe(switchMap((blob) => mapBlobToBase64(blob)));
  }

  saveCover(folder: string, cover: string): Observable<void> {
    return this.http.post<void>(this.baseUrl, { folder, cover });
  }
}
