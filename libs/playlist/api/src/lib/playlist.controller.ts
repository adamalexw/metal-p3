import { PlaylistDto } from '@metal-p3/playlist/domain';
import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
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

  @Put()
  update(@Body() body: PlaylistDto): Observable<PlaylistDto> {
    return this.service.updatePlaylist(body);
  }

  @Delete('remove')
  remove(@Query('itemId') itemId: number): Observable<boolean | Error> {
    return this.service.removeItem(+itemId);
  }

  @Delete()
  delete(@Query('playlistId') playlistId: number): Observable<boolean | Error> {
    return this.service.deletePlaylist(+playlistId);
  }
}
