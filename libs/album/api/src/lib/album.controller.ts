import { AlbumDto, MetalArchivesAlbumTrack, MetalArchivesSearchResponse, RenameFolder, SearchRequest, TrackDto } from '@metal-p3/api-interfaces';
import { Album } from '@metal-p3/prisma/client';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { TrackService } from '@metal-p3/track/api';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { join } from 'path';
import { map, Observable, of, switchMap } from 'rxjs';
import { AlbumService } from './album.service';

@Controller('album')
export class AlbumController {
  constructor(
    private readonly albumService: AlbumService,
    private readonly trackService: TrackService,
    private readonly metalArchivesService: MetalArchivesService,
    private readonly fileSystemService: FileSystemService,
  ) {}

  @Get('search')
  albums(@Query() request: SearchRequest): Observable<AlbumDto[]> {
    return this.albumService.getAlbums(request);
  }

  @Get('tracks')
  tracks(@Query('folder') folder: string): Observable<TrackDto[]> {
    return of(this.fileSystemService.getFiles(folder)).pipe(
      map((files) => files.map((file) => join(folder, file))),
      switchMap((files) => this.trackService.getTracks(files)),
    );
  }

  @Get('extraFiles')
  extraFiles(@Query('folder') folder: string): boolean {
    return this.albumService.hasExtraFiles(folder);
  }

  @Patch()
  patch(@Body() album: AlbumDto): Promise<Album> {
    return this.albumService.saveAlbum(album);
  }

  @Patch('setHasLyrics')
  setHasLyrics(@Query('id') id: number, @Query('hasLyrics') hasLyrics: boolean): Promise<Album> {
    return this.albumService.setHasLyrics(+id, !!hasLyrics);
  }

  @Patch('setTransferred')
  setTransferred(@Query('id') id: number, @Query('transferred') transferred: boolean): Promise<Album> {
    return this.albumService.setTransferred(+id, !!transferred);
  }

  @Patch('setPlayed')
  setPlayed(@Query('id') id: number, @Query('played') played: boolean): Promise<Album> {
    return this.albumService.setPlayed(+id, played === true || (played as unknown as string) === 'true');
  }

  @Post()
  post(@Body() body: { folder: string }): Observable<AlbumDto> {
    return this.albumService.addAlbum(body.folder);
  }

  @Get('findMaUrl')
  findUrl(@Query('artist') artist: string, @Query('album') album: string): Observable<MetalArchivesSearchResponse> {
    return this.metalArchivesService.findUrl(artist, album);
  }

  @Get('maTracks')
  maTracks(@Query('url') url: string): Observable<MetalArchivesAlbumTrack[]> {
    return this.metalArchivesService.getTracks(url);
  }

  @Get('getLyrics')
  getLyrics(@Query('trackId') trackId: string): Observable<string> {
    return this.metalArchivesService.getLyrics(trackId);
  }

  @Post('openFolder')
  @HttpCode(HttpStatus.ACCEPTED)
  openFolder(@Body('folder') folder: string): void {
    return this.fileSystemService.openFolder(folder);
  }

  @Patch('rename')
  rename(@Body() body: { id: number; src: string; dest: string }): Promise<RenameFolder> {
    return this.albumService.renameFolder(body.id, body.src, body.dest);
  }

  @Get('createAlbumFromRootFiles')
  createAlbumFromRootFiles(@Query('folder') folder: string): string[] {
    return this.albumService.createAlbumFromRootFiles(folder);
  }

  @Get(':id')
  album(@Param('id') id: number): Promise<AlbumDto> {
    return this.albumService.getAlbum(+id);
  }

  @Delete()
  deleteAlbum(@Query('id') id: number): Promise<boolean> {
    return this.albumService.deleteAlbum(+id);
  }
}
