import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BandService {
  readonly baseUrl = `${this.api}band`;

  constructor(
    private readonly http: HttpClient,
    @Inject(API) private readonly api: string,
  ) {}

  saveBand(band: BandDto): Observable<void> {
    return this.http.patch<void>(this.baseUrl, band);
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.http.get<BandProps>(`${this.baseUrl}/props?url=${encodeURIComponent(url)}`);
  }
}
