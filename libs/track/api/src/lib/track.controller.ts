import { RenameTrack, TrackDto, TransferPlaylistRequest } from '@metal-p3/api-interfaces';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Observable, throwIfEmpty } from 'rxjs';
import { TrackService } from './track.service';

@Controller('track')
export class TrackController {
  constructor(
    private readonly trackService: TrackService,
    private readonly fileSystemService: FileSystemService,
  ) {}

  @Get('files')
  files(@Query('folder') folder: string): string[] {
    return this.fileSystemService.getFiles(folder);
  }

  @Get('trackDetails')
  trackDetails(@Query('file') file: string, @Query('id') id: number): Observable<TrackDto> {
    return this.trackService.trackDetails(file, id).pipe(
      throwIfEmpty(() => new NotFoundException(`Track details not found for file: ${file}`))
    );
  }

  @Patch()
  patch(@Body() track: TrackDto): Promise<boolean> {
    return this.trackService.saveTrack(track);
  }

  @Patch('batch')
  saveTracks(@Body() tracks: TrackDto[]): Promise<boolean> {
    return this.trackService.saveTracks(tracks);
  }

  @Patch('rename')
  rename(@Body() track: TrackDto): RenameTrack {
    return this.trackService.renameTrack(track);
  }

  @Post('openFolder')
  @HttpCode(HttpStatus.ACCEPTED)
  openFolder(@Body('folder') folder: string): void {
    return this.fileSystemService.openFolder(folder);
  }

  @Get('transferTrack')
  transferTrack(@Query('file') file: string): Promise<void> {
    return this.trackService.transferTrack(file);
  }

  @Post('transferPlaylist')
  @HttpCode(HttpStatus.ACCEPTED)
  transferPlaylist(@Body() request: TransferPlaylistRequest): Promise<void> {
    return this.trackService.transferPlaylist(request);
  }

  @Get('playTrack')
  playTrack(@Query('file') file: string, @Res() res: Response) {
    const stats = this.fileSystemService.getFileStats(file);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': stats.size,
    });
    this.trackService.playTrack(file).pipe(res);
  }

  @Delete()
  delete(@Query('file') file: string) {
    this.fileSystemService.deleteFile(file);
  }
}
