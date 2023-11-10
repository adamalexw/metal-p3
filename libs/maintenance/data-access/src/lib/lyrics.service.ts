import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { LYRICS_HISTORY_COMPLETE, LYRICS_HISTORY_UPDATE } from '@metal-p3/api-interfaces';
import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LyricsMaintenanceService {
  readonly baseUrl = `${this.api}maintenance/lyrics`;

  constructor(private readonly http: HttpClient, private readonly socket: Socket, @Inject(API) private readonly api: string) {}

  getHistory(): Observable<LyricsHistoryDto[]> {
    return this.http.get<LyricsHistoryDto[]>(`${this.baseUrl}/history`);
  }

  checkHistory(): Observable<LyricsHistoryDto[]> {
    return this.http.get<LyricsHistoryDto[]>(`${this.baseUrl}/checkHistory`);
  }

  getPriority(): Observable<LyricsHistoryDto[]> {
    return this.http.get<LyricsHistoryDto[]>(`${this.baseUrl}/priority`);
  }

  addPriority(albumId: number): Observable<LyricsHistoryDto> {
    return this.http.post<LyricsHistoryDto>(`${this.baseUrl}/priority?albumId=${albumId}`, {});
  }

  checkPriority(): Observable<LyricsHistoryDto[]> {
    return this.http.get<LyricsHistoryDto[]>(`${this.baseUrl}/checkPriority`);
  }

  lyricsHistoryUpdate(): Observable<LyricsHistoryDto> {
    return this.socket.fromEvent(LYRICS_HISTORY_UPDATE);
  }

  lyricsHistoryComplete(): Observable<boolean> {
    return this.socket.fromEvent(LYRICS_HISTORY_COMPLETE);
  }

  checkedLyricsHistory(id: number, checked: boolean): Observable<LyricsHistoryDto> {
    return this.http.patch<LyricsHistoryDto>(`${this.baseUrl}/checked?id=${id}&checked=${checked}`, {});
  }

  deleteLyricsHistory(id: number): Observable<boolean | Error> {
    return this.http.delete<boolean | Error>(`${this.baseUrl}?id=${id}`, {});
  }

  cancelHistoryCheck(): Observable<void> {
    return this.http.get<never>(`${this.baseUrl}/cancel`);
  }
}
