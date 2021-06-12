import { AlbumDto, RenameFolder } from '@metal-p3/api-interfaces';
import { DbService } from '@metal-p3/shared/database';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { TrackService } from '@metal-p3/track/api';
import { Inject, Injectable } from '@nestjs/common';
import { Album, Band, Prisma } from '@prisma/client';
import * as fs from 'fs';
import { Tags } from 'node-id3';
import * as path from 'path';
import { forkJoin, from, iif, Observable, of } from 'rxjs';
import { concatMap, filter, map, take } from 'rxjs/operators';
import { AlbumGateway } from './album-gateway.service';

@Injectable()
export class AlbumService {
  constructor(
    private readonly dbService: DbService,
    private readonly fileSystemService: FileSystemService,
    private readonly trackService: TrackService,
    private readonly albumGateway: AlbumGateway,
    @Inject('BASE_PATH') private basePath: string
  ) {
    if (basePath) {
      this.addFileWatcher(basePath);
    }
  }

  getAlbums(request: { skip?: number; take?: number; criteria?: string }): Observable<AlbumDto[]> {
    let where: Prisma.AlbumWhereInput;

    if (request.criteria) {
      where = {
        Folder: { contains: request.criteria },
      };
    }

    return from(this.dbService.albums({ skip: request.skip, take: request.take, where, orderBy: { Created: 'desc' } })).pipe(map((albums) => albums.map((album) => this.mapAlbumToAlbumDto(album))));
  }

  getAlbum(id: number): Observable<AlbumDto> {
    return from(this.dbService.album({ AlbumId: +id })).pipe(map((album) => this.mapAlbumToAlbumDto(album)));
  }

  private mapAlbumToAlbumDto(album: Album): AlbumDto {
    const band = album['Band'] as Band;

    return {
      id: album.AlbumId,
      fullPath: path.join(this.basePath, album.Folder),
      folder: album.Folder,
      bandId: band.BandId,
      artist: band.Name,
      album: album.Name,
      year: album.Year,
      genre: band.Genre,
      country: band.Country,
      albumUrl: album.MetalArchiveUrl,
      artistUrl: band.MetalArchiveUrl,
      transferred: album.Transferred,
      hasLyrics: album.Lyrics,
    };
  }

  private addFileWatcher(basePath: string) {
    fs.watch(basePath, (eventType, folder) => {
      if (eventType === 'change') {
        const fullPath = path.join(this.basePath, folder);

        if (fs.existsSync(fullPath) && this.fileSystemService.isFolder(fullPath)) {
          if (this.albumGateway.newAlbums.indexOf(folder) === -1) {
            this.albumGateway.newAlbums.push(folder);
            this.albumGateway.albumAddedMessage(folder);
          }
        }
      }
    });
  }

  addAlbum(folder: string): Observable<AlbumDto> {
    const dirName = this.fileSystemService.getFilename(folder);
    return this.getAlbums({ take: 1, criteria: dirName }).pipe(
      take(1),
      filter((album) => !album.length),
      map(() => {
        this.fileSystemService.moveFilesToTheRoot(folder, folder);

        const files = this.fileSystemService.getFiles(folder);

        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          if (path.extname(file) == '.mp3') {
            const tags = this.trackService.getTags(path.join(folder, file));

            return tags;
          }
        }
      }),
      filter((tags) => !!tags?.artist),
      concatMap((tags) => forkJoin([of(tags), from(this.dbService.bands({ Name: tags.artist }))])),
      concatMap(([tags, bands]) => forkJoin([of(tags), iif(() => !!bands.length, of(bands[0]), from(this.dbService.createBand({ Name: tags.artist })))])),
      map(([tags, band]) => this.mapTagsToAlbum(path.basename(folder), tags, band)),
      concatMap((data) => from(this.dbService.createAlbum(data))),
      map((newAlbum) => this.mapAlbumToAlbumDto(newAlbum))
    );
  }

  private mapTagsToAlbum(folder: string, tags: Tags, band: Band): Prisma.AlbumCreateInput {
    const bandInput: Prisma.BandCreateNestedOneWithoutAlbumInput = {
      connect: { BandId: band.BandId },
    };

    const lyrics = !!tags.unsynchronisedLyrics?.text;

    const input: Prisma.AlbumCreateInput = {
      Folder: folder,
      Name: tags.album,
      Year: tags.year && +tags.year,
      Transferred: false,
      Lyrics: lyrics,
      LyricsDate: lyrics ? new Date() : null,
      Band: bandInput,
    };

    return input;
  }

  async saveAlbum(album: AlbumDto): Promise<void> {
    this.dbService.updateAlbum({ where: { AlbumId: album.id }, data: this.mapAlbumDtoToAlbum(album) });
  }

  private mapAlbumDtoToAlbum(albumDto: AlbumDto): Partial<Album> {
    return {
      Folder: albumDto.folder,
      Lyrics: albumDto.hasLyrics,
      MetalArchiveUrl: albumDto.albumUrl,
      Name: albumDto.album,
      Transferred: albumDto.transferred,
    };
  }

  async renameFolder(id: number, src: string, dest: string): Promise<RenameFolder> {
    const folder = this.fileSystemService.filenameValidator(this.fileSystemService.getFilename(dest));
    const fullPath = `${this.basePath}/${folder}`;

    this.fileSystemService.renameFolder(src, fullPath);

    this.dbService.updateAlbum({ where: { AlbumId: +id }, data: { Folder: folder } });

    return { fullPath, folder };
  }

  createAlbumFromRootFiles(basePath: string): string[] {
    const newAlbums: string[] = [];
    const mp3s = this.fileSystemService.getFiles(basePath).filter((f) => path.extname(f) === '.mp3');

    if (mp3s.length) {
      for (let index = 0; index < mp3s.length; index++) {
        const mp3 = path.join(basePath, mp3s[index]);

        const tags = this.trackService.getTags(mp3);

        if (tags.artist && tags.album) {
          const folder = this.fileSystemService.filenameValidator(`${tags.artist} - ${tags.album}`);
          const location = path.join(basePath, folder);

          if (!fs.existsSync(location)) {
            fs.mkdirSync(location);
            newAlbums.push(folder);
          }

          this.fileSystemService.renameFile(mp3, path.join(location, mp3s[index]));
        }
      }
    }

    return newAlbums;
  }
}
