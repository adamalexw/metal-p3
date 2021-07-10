import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { Controller, Delete, Get, Patch, Post, Query } from '@nestjs/common';
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

  @Get('checkPriority')
  checkPriority(): void {
    this.lyricsService.checkPriority().subscribe();
  }

  @Get('checkHistory')
  checkHistory(): void {
    this.lyricsService.checkHistory().subscribe();
  }

  @Patch('checked')
  setChecked(@Query('id') id: number, @Query('checked') checked: boolean): Observable<LyricsHistoryDto> {
    return this.lyricsService.setChecked(+id, !!checked);
  }

  @Delete()
  deleteHistory(@Query('id') id: number): Observable<boolean | Error> {
    return this.lyricsService.deleteHistory(+id);
  }

  @Get('cancel')
  cancelHistoryCheck(): void {
    this.lyricsService.cancelHistoryCheck();
  }
}
