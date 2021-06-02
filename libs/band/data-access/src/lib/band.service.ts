import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BandService {
  readonly baseUrl = '/api/band';

  constructor(private http: HttpClient) {}

  saveBand(band: BandDto): Observable<never> {
    return this.http.patch<never>(this.baseUrl, band);
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.http.get<BandProps>(`${this.baseUrl}/props?url=${encodeURIComponent(url)}`);
  }
}
