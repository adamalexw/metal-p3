import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_MATCHER, URL_MATCHER_COMPLETE } from '@metal-p3/api-interfaces';
import { UrlMatcher } from '@metal-p3/maintenance/domain';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UrlMaintenanceService {
  readonly baseUrl = '/api/maintenance/url';

  constructor(private http: HttpClient, private socket: Socket) {}

  list(): Observable<UrlMatcher[]> {
    return this.http.get<UrlMatcher[]>(`${this.baseUrl}/list`);
  }

  match(): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/match`);
  }

  update(): Observable<UrlMatcher> {
    return this.socket.fromEvent(URL_MATCHER);
  }

  complete(): Observable<boolean> {
    return this.socket.fromEvent(URL_MATCHER_COMPLETE);
  }

  cancel(): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/cancel`);
  }
}
