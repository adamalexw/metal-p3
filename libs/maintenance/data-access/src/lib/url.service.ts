import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { URL_MATCHER, URL_MATCHER_COMPLETE } from '@metal-p3/api-interfaces';
import { UrlMatcher } from '@metal-p3/maintenance/domain';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UrlMaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);
  private readonly socket = inject(Socket);

  readonly baseUrl = `${this.api}maintenance/url`;

  list(): Observable<UrlMatcher[]> {
    return this.http.get<UrlMatcher[]>(`${this.baseUrl}/list`);
  }

  match(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/match`);
  }

  update(): Observable<UrlMatcher> {
    return this.socket.fromEvent(URL_MATCHER);
  }

  complete(): Observable<boolean> {
    return this.socket.fromEvent(URL_MATCHER_COMPLETE);
  }

  cancel(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/cancel`);
  }
}
