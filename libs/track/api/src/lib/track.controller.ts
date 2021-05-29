import { Track } from '@metal-p3/api-interfaces';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TrackService } from './track.service';

@Controller('track')
export class TrackController {
  constructor(private readonly trackService: TrackService, private readonly fileSystemService: FileSystemService) {}

  @Get('files')
  files(@Query('folder') folder: string): string[] {
    return this.fileSystemService.getFiles(folder);
  }

  @Get('trackDetails')
  trackDetails(@Query('file') file: string, @Query('id') id: number): Observable<Track> {
    return this.trackService.trackDetails(file, id);
  }

  @Patch()
  @HttpCode(HttpStatus.ACCEPTED)
  patch(@Body() track: Track): void {
    this.trackService.saveTrack(track);
  }

  @Patch('rename')
  rename(@Body() track: Track): string {
    return this.trackService.renameTrack(track);
  }

  @Get('openFolder')
  @HttpCode(HttpStatus.ACCEPTED)
  openFolder(@Query('folder') folder: string): void {
    return this.fileSystemService.openFolder(folder);
  }

  @Get('transferTrack')
  transferTrack(@Query('file') file: string): Promise<void> {
    return this.trackService.transferTrack(file);
  }
}
