import { Track } from '@metal-p3/api-interfaces';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileSystemService } from '../shared/file-system.service';
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

  @Get('openFolder')
  @HttpCode(HttpStatus.ACCEPTED)
  openFolder(@Query('folder') folder: string): void {
    return this.fileSystemService.openFolder(folder);
  }
}
