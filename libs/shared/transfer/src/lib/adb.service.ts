import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { Observable } from 'rxjs';

@Injectable()
export class AdbService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);

  private readonly baseUrl = `${this.api}adb`;

  connectPhone(host: string, port: number): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/connect`, { host, port });
  }
}
