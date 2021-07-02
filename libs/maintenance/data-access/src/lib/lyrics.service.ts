import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LyricsMaintenanceService {
  readonly baseUrl = '/api/maintenance/lyrics';

  constructor(private http: HttpClient, private socket: Socket) {}

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
    return this.socket.fromEvent('lyricsHistoryUpdate');
  }

  lyricsHistoryComplete(): Observable<boolean> {
    return this.socket.fromEvent('lyricsHistoryComplete');
  }

  checkedLyricsHistory(id: number, checked: boolean): Observable<LyricsHistoryDto> {
    return this.http.patch<LyricsHistoryDto>(`${this.baseUrl}/checked?id=${id}&checked=${checked}`, {});
  }

  deleteLyricsHistory(id: number): Observable<boolean | Error> {
    return this.http.delete<boolean | Error>(`${this.baseUrl}?id=${id}`, {});
  }
}
