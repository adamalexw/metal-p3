import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, map, Observable, of, timeout } from 'rxjs';

export interface LrcLibParams {
  artistName: string;
  trackName: string;
  albumName: string;
  durationSeconds?: number;
}

export interface LrcLibResult {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  instrumental: boolean;
}

interface LrcLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

@Injectable()
export class LrcLibService {
  private readonly logger = new Logger(LrcLibService.name);
  private readonly baseUrl = 'https://lrclib.net';
  private readonly userAgent = 'metal-p3 (https://github.com/adamalexw/metal-p3)';

  constructor(private readonly httpService: HttpService) {}

  getSyncedLyrics(params: LrcLibParams): Observable<LrcLibResult | null> {
    if (!params.artistName?.trim() || !params.trackName?.trim() || !params.albumName?.trim()) {
      throw new BadRequestException('artistName, trackName and albumName are required');
    }

    const query = new URLSearchParams({
      artist_name: params.artistName,
      track_name: params.trackName,
      album_name: params.albumName,
    });
    if (params.durationSeconds && params.durationSeconds > 0) {
      query.set('duration', String(Math.round(params.durationSeconds)));
    }

    const url = `${this.baseUrl}/api/get?${query.toString()}`;

    return this.httpService.get<LrcLibResponse>(url, { headers: { 'User-Agent': this.userAgent } }).pipe(
      timeout(15_000),
      map((response) => this.toResult(response.data)),
      catchError((error: AxiosError) => {
        if (error.response?.status === 404) {
          return of(null);
        }
        this.logger.error(`lrclib request failed: ${url}`, error.message);
        return of(null);
      }),
    );
  }

  private toResult(data: LrcLibResponse): LrcLibResult {
    return {
      syncedLyrics: data.syncedLyrics?.trim() ? data.syncedLyrics : null,
      plainLyrics: data.plainLyrics?.trim() ? data.plainLyrics : null,
      instrumental: !!data.instrumental,
    };
  }
}
