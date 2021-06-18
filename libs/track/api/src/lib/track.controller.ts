import { RenameTrack, Track } from '@metal-p3/api-interfaces';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Query, Res } from '@nestjs/common';
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
  patch(@Body() track: Track): boolean | Error {
    return this.trackService.saveTrack(track);
  }

  @Patch('rename')
  rename(@Body() track: Track): RenameTrack {
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

  @Get('playTrack')
  playTrack(@Query('file') file: string, @Res() res) {
    const stats = this.fileSystemService.getFileStats(file);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': stats.size,
    });
    this.trackService.playTrack(file).pipe(res);
  }
}
