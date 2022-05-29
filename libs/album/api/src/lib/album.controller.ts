import { Album } from '.prisma/client';
import { AlbumDto, MetalArchivesAlbumTrack, MetalArchivesSearchResponse, RenameFolder, SearchRequest, TrackDto } from '@metal-p3/api-interfaces';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { TrackService } from '@metal-p3/track/api';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { join } from 'path';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AlbumService } from './album.service';

@Controller('album')
export class AlbumController {
  constructor(
    private readonly albumService: AlbumService,
    private readonly trackService: TrackService,
    private readonly metalArchivesService: MetalArchivesService,
    private readonly fileSystemService: FileSystemService
  ) {}

  @Get('search')
  albums(@Query() request: SearchRequest): Observable<AlbumDto[]> {
    return this.albumService.getAlbums(request);
  }

  @Get('tracks')
  tracks(@Query('folder') folder: string): Observable<TrackDto[]> {
    return of(this.fileSystemService.getFiles(folder)).pipe(
      map((files) => files.map((file) => join(folder, file))),
      switchMap((files) => this.trackService.getTracks(files))
    );
  }

  @Get('extraFiles')
  extraFiles(@Query('folder') folder: string): boolean {
    return this.albumService.hasExtraFiles(folder);
  }

  @Patch()
  patch(@Body() album: AlbumDto): Observable<Album> {
    return this.albumService.saveAlbum(album);
  }

  @Patch('setHasLyrics')
  setHasLyrics(@Query('id') id: number, @Query('hasLyrics') hasLyrics: boolean): Observable<Album> {
    return this.albumService.setHasLyrics(+id, !!hasLyrics);
  }

  @Patch('setTransferred')
  setTransferred(@Query('id') id: number, @Query('transferred') transferred: boolean): Observable<Album> {
    return this.albumService.setTransferred(+id, !!transferred);
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

  @Get('openFolder')
  @HttpCode(HttpStatus.ACCEPTED)
  openFolder(@Query('folder') folder: string): void {
    return this.fileSystemService.openFolder(folder);
  }

  @Get('rename')
  rename(@Query('id') id: number, @Query('src') src: string, @Query('dest') dest: string): Promise<RenameFolder> {
    return this.albumService.renameFolder(id, src, dest);
  }

  @Get('createAlbumFromRootFiles')
  createAlbumFromRootFiles(@Query('folder') folder: string): string[] {
    return this.albumService.createAlbumFromRootFiles(folder);
  }

  @Get(':id')
  album(@Param('id') id: number): Observable<AlbumDto> {
    return this.albumService.getAlbum(+id);
  }

  @Delete()
  deleteAlbum(@Query('id') id: number): Observable<boolean | Error> {
    return this.albumService.deleteAlbum(+id);
  }
}
