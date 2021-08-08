import { UrlMatcher } from '@metal-p3/maintenance/domain';
import { Controller, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UrlService } from './url.service';

@Controller('maintenance/url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Get('list')
  getMissingUrls(): Observable<UrlMatcher[]> {
    return this.urlService.getMissingUrls();
  }

  @Get('match')
  matchUrls(): Observable<UrlMatcher[]> {
    return this.urlService.matcherMissingAlbums();
  }

  @Get('cancel')
  cancelMatching(): void {
    this.urlService.cancelMatching();
  }
}
