import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { mapBlobToBase64 } from '@metal-p3/shared/utils';
import { map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CoverService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);

  private readonly baseUrl = `${this.api}cover`;

  getCover(location: string): Observable<string> {
    return this.http.get(`${this.baseUrl}?location=${encodeURIComponent(location)}`, { responseType: 'blob' }).pipe(map((blob) => (blob?.size > 0 ? URL.createObjectURL(blob) : '/assets/blank.png')));
  }

  downloadCover(url: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/download?url=${encodeURIComponent(url)}`, { responseType: 'blob' }).pipe(map((blob) => (blob.size > 0 ? URL.createObjectURL(blob) : '/assets/blank.png')));
  }

  getCoverDto(blobUrl: string): Observable<unknown> {
    return this.http.get(blobUrl, { responseType: 'blob' }).pipe(switchMap((blob) => mapBlobToBase64(blob)));
  }

  saveCover(folder: string, cover: string): Observable<void> {
    return this.http.post<void>(this.baseUrl, { folder, cover });
  }
}
