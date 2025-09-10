import { MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { UrlMatcher } from '@metal-p3/maintenance/domain';
import { Album } from '@metal-p3/prisma/client';
import { DbService } from '@metal-p3/shared/database';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { extractUrl } from '@metal-p3/shared/utils';
import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject, catchError, concatMap, finalize, from, map, of, takeUntil, tap, toArray } from 'rxjs';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Injectable()
export class UrlService {
  notifier = new Subject<void>();

  constructor(
    private readonly dbService: DbService,
    private readonly metalArchivesService: MetalArchivesService,
    private readonly maintenanceGateway: MaintenanceGateway,
  ) {}

  getMissingUrls(): Observable<UrlMatcher[]> {
    return from(this.dbService.missingUrls()).pipe(map((albums) => albums.map((album) => this.albumToMatcherDto(album))));
  }

  matcherMissingAlbums(): Observable<UrlMatcher[]> {
    this.notifier = new Subject();
    return this.matchUrls(this.getMissingUrls()).pipe(
      takeUntil(this.notifier),
      finalize(() => this.maintenanceGateway.urlMatcherComplete()),
    );
  }

  private albumToMatcherDto(album: Partial<Album>): UrlMatcher {
    return {
      id: album.AlbumId,
      bandId: album['Band'].BandId,
      band: album['Band'].Name,
      artistUrl: album['Band'].MetalArchiveUrl,
      album: album.Name,
    };
  }

  cancelMatching() {
    this.notifier.next();
    this.notifier.complete();
  }

  matchUrls(source$: Observable<UrlMatcher[]>): Observable<UrlMatcher[]> {
    return source$.pipe(
      concatMap((albums) =>
        from(albums).pipe(
          concatMap((matcher) =>
            this.metalArchivesService.findUrl(matcher.band, matcher.album).pipe(
              map((response) => this.extractOutcome(matcher, response)),
              tap((outcome) => {
                if (outcome.result === 'success') {
                  this.dbService.updateAlbum({
                    where: { AlbumId: outcome.id },
                    data: { MetalArchiveUrl: outcome.albumUrl },
                  });

                  if (!matcher.artistUrl) {
                    this.dbService.updateBand({ where: { BandId: matcher.bandId }, data: { MetalArchiveUrl: outcome.artistUrl } });
                  }
                }
              }),
              catchError((error) => {
                Logger.error(error);
                return of({ ...matcher, result: 'error', error } as UrlMatcher);
              }),
              tap((matcher) => this.maintenanceGateway.urlMatcher(matcher)),
              toArray(),
            ),
          ),
        ),
      ),
    );
  }

  extractOutcome(matcher: UrlMatcher, response: MetalArchivesSearchResponse): UrlMatcher {
    if (response.iTotalRecords > 1) {
      const fullLengths = response.results.filter((r) => r.releaseType === 'Full-length');

      if (fullLengths.length === 1) {
        return {
          ...matcher,
          result: 'success',
          artistUrl: fullLengths[0].artistUrl,
          albumUrl: fullLengths[1].albumUrl,
        };
      }

      return {
        ...matcher,
        result: 'multiple',
        albumUrl: `https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURIComponent(matcher.band)}&releaseTitle=${encodeURIComponent(matcher.album)}`,
      };
    }

    if (response.iTotalRecords === 0) {
      return {
        ...matcher,
        result: 'none',
        albumUrl: `https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURIComponent(matcher.band)}`,
      };
    }

    return {
      ...matcher,
      result: 'success',
      artistUrl: extractUrl(response.aaData[0][0]),
      albumUrl: extractUrl(response.aaData[0][1]),
    };
  }
}
