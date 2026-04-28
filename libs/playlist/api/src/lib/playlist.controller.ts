import { PlaylistDto } from '@metal-p3/playlist/domain';
import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { PlaylistService } from './playlist.service';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly service: PlaylistService) {}

  @Get('list')
  list(): Promise<PlaylistDto[]> {
    return this.service.getPlaylists();
  }

  @Get()
  get(@Query('playlistId') playlistId: number): Promise<PlaylistDto> {
    return this.service.getPlaylist(+playlistId);
  }

  @Post()
  create(@Body() body: PlaylistDto): Promise<PlaylistDto> {
    return this.service.createPlaylist(body);
  }

  @Put()
  update(@Body() body: PlaylistDto): Promise<PlaylistDto> {
    return this.service.updatePlaylist(body);
  }

  @Delete('remove')
  remove(@Query('itemId') itemId: number): Promise<boolean> {
    return this.service.removeItem(+itemId);
  }

  @Delete()
  delete(@Query('playlistId') playlistId: number): Promise<boolean> {
    return this.service.deletePlaylist(+playlistId);
  }
}
