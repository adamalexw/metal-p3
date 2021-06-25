import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { Controller, Get, Post, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LyricsService } from './lyrics.service';

@Controller('maintenance/lyrics')
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @Get('history')
  get(): Observable<LyricsHistoryDto[]> {
    return this.lyricsService.getHistory();
  }

  @Get('priority')
  getPriority(): Observable<LyricsHistoryDto[]> {
    return this.lyricsService.getPriority();
  }

  @Post('priority')
  addPriority(@Query('albumId') albumId: number): Observable<LyricsHistoryDto> {
    return this.lyricsService.addPriority(+albumId);
  }
}
