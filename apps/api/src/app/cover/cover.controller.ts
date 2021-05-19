import { Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CoverService } from './cover.service';

@Controller('cover')
export class CoverController {
  constructor(private readonly coverService: CoverService) {}

  @Get()
  get(@Query('location') location: string): Observable<string> {
    return this.coverService.getCover(location);
  }

  @Get('download')
  download(@Query('url') url: string | string[]): Observable<string> {
    return this.coverService.downloadCover(url);
  }
}
