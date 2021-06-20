import { DbService } from '@metal-p3/shared/database';
import { Injectable } from '@nestjs/common';
import { LyricsHistory } from '@prisma/client';
import { from, Observable } from 'rxjs';

@Injectable()
export class LyricsService {
  constructor(private readonly dbService: DbService) {}

  getHistory(): Observable<LyricsHistory[]> {
    return from(this.dbService.lyricsHistory());
  }

  getPriority(): Observable<LyricsHistory[]> {
    return from(this.dbService.lyricsPriority());
  }
}
