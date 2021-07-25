import { PlaylistDto } from '@metal-p3/player/domain';
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PlaylistService } from './playlist.service';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly service: PlaylistService) {}

  @Get('list')
  list(): Observable<PlaylistDto[]> {
    return this.service.getPlaylists();
  }

  @Get()
  get(@Query('playlistId') playlistId: number): Observable<PlaylistDto> {
    return this.service.getPlaylist(+playlistId);
  }

  @Post()
  create(@Body() body: PlaylistDto): Observable<PlaylistDto> {
    return this.service.createPlaylist(body);
  }

  @Delete()
  delete(@Query('playlistId') playlistId: number): Observable<boolean | Error> {
    return this.service.deletePlaylist(+playlistId);
  }
}
