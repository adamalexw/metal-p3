import { LyricsHistory } from '.prisma/client';
import { Controller, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LyricsService } from './lyrics.service';

@Controller('maintenance/lyrics')
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @Get('history')
  get(): Observable<LyricsHistory[]> {
    return this.lyricsService.getHistory();
  }

  @Get('priority')
  priority(): Observable<LyricsHistory[]> {
    return this.lyricsService.getPriority();
  }
}
