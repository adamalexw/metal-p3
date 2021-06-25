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

  getPriority(): Observable<LyricsHistoryDto[]> {
    return this.http.get<LyricsHistoryDto[]>(`${this.baseUrl}/priority`);
  }

  addPriority(albumId: number): Observable<LyricsHistoryDto> {
    return this.http.post<LyricsHistoryDto>(`${this.baseUrl}/priority?albumId=${albumId}`, {});
  }
}
