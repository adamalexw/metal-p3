import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { map, Observable } from 'rxjs';

@Injectable()
export class AdbService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);

  private readonly baseUrl = `${this.api}adb`;

  pairPhone(host: string, port: number, code: string): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/pair`, { host, port, code }, { responseType: 'text' as 'json' });
  }

  connectPhone(host: string, port: number): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/connect`, { host, port }, { responseType: 'text' as 'json' });
  }

  isWifiConnected(): Observable<boolean> {
    return this.http.get<{ connected: boolean }>(`${this.baseUrl}/wifi`).pipe(map(({ connected }) => connected));
  }
}
