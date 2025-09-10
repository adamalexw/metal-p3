import { AlbumDto, RenameFolder, SearchRequest } from '@metal-p3/api-interfaces';
import { Album, Band, Prisma } from '@metal-p3/prisma/client';
import { DbService } from '@metal-p3/shared/database';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { TrackService } from '@metal-p3/track/api';
import { Inject, Injectable, Logger } from '@nestjs/common';
import chokidar from 'chokidar';
import * as fs from 'fs';
import * as NodeID3 from 'node-id3';
import * as path from 'path';
import { Observable, catchError, combineLatest, concatMap, delay, from, iif, map, mergeMap, of, tap } from 'rxjs';
import { AlbumGateway } from './album-gateway.service';

@Injectable()
export class AlbumService {
  constructor(
    private readonly dbService: DbService,
    private readonly fileSystemService: FileSystemService,
    private readonly trackService: TrackService,
    private readonly albumGateway: AlbumGateway,
    @Inject('BASE_PATH') private readonly basePath: string,
    @Inject('TAKE') private readonly take: number,
  ) {
    if (basePath) {
      this.addFileWatcher(basePath);
    }
  }

  getAlbums(request: SearchRequest): Observable<AlbumDto[]> {
    let where: Prisma.AlbumWhereInput;
    let bandWhere: Prisma.BandWhereInput;

    if (request.folder) {
      // when adding a new folder
      if (request.exactMatch) {
        where = {
          Folder: { equals: request.folder },
        };
      } else {
        where = {
          Folder: { contains: request.folder },
        };
      }
    }

    if (request.artist) {
      bandWhere = {
        Name: { contains: request.artist },
      };
    }

    if (request.album) {
      where = {
        ...where,
        Name: { contains: request.album },
      };
    }

    if (request.country) {
      bandWhere = {
        ...bandWhere,
        Country: { contains: request.country },
      };
    }

    if (request.genre) {
      bandWhere = {
        ...bandWhere,
        Genre: { contains: request.genre },
      };
    }

    if (request.year) {
      where = {
        ...where,
        Year: request.year,
      };
    }

    if (request.hasLyrics) {
      where = {
        ...where,
        Lyrics: Boolean(request.hasLyrics),
      };
    }

    if (request.transferred) {
      where = {
        ...where,
        Transferred: Boolean(request.transferred),
      };
    }

    if (bandWhere) {
      where = {
        ...where,
        Band: bandWhere,
      };
    }

    return from(this.dbService.albums({ skip: +(request.skip ?? 0), take: +(request.take ?? this.take), where, orderBy: { Created: 'desc' } })).pipe(
      catchError((err) => {
        console.log(err);
        return of([]);
      }),
      map((albums) => albums.map((album) => this.mapAlbumToAlbumDto(album))),
    );
  }

  getAlbum(id: number): Observable<AlbumDto> {
    return from(this.dbService.album({ AlbumId: id })).pipe(map((album) => this.mapAlbumToAlbumDto(album)));
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
      ignore: album.IgnoreMetalArchives ?? false,
      transferred: album.Transferred,
      hasLyrics: album.Lyrics,
      dateCreated: album.Created.toISOString(),
    };
  }

  hasExtraFiles(folder: string): boolean {
    return this.fileSystemService.hasExtraFiles(this.basePath, folder);
  }

  private addFileWatcher(basePath: string) {
    const watcher = chokidar.watch(basePath, {
      depth: 1,
      ignored: /(^|[/\\])\../,
      awaitWriteFinish: {
        stabilityThreshold: 5000,
        pollInterval: 2000,
      },
      ignoreInitial: true,
    });

    watcher.on('ready', () => console.log('Initial scan complete. Ready for changes', new Date()));

    watcher.on('addDir', (path) => {
      const folder = this.fileSystemService.getFilename(path);

      // ensure we aren't renanming an existing folder
      this.dbService
        .albums({ take: 1, where: { Folder: folder } })
        .then((album) => {
          if (!album.length) {
            this.albumGateway.albumAddedMessage(this.fileSystemService.getFilename(path));
          }
        })
        .catch((error) => Logger.error(error));
    });
  }

  addAlbum(folder: string): Observable<AlbumDto> {
    const dirName = this.fileSystemService.getFilename(folder);

    return this.getAlbums({ take: 1, folder: dirName, exactMatch: true }).pipe(
      map((album) => {
        if (album.length) {
          throw new Error('folder already exists');
        }
      }),
      delay(5000),
      map(() => {
        this.fileSystemService.moveFilesToTheRoot(folder, folder);

        const files = this.fileSystemService.getFiles(folder);

        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          if (path.extname(file) == '.mp3') {
            const tags = this.trackService.getTags(path.join(folder, file));

            if (tags.artist) {
              return tags;
            }

            const folderName = this.fileSystemService.getFilename(folder);
            const folderSplit = folderName.split('-');

            return { ...tags, artist: folderSplit[0].trim(), album: folderSplit?.[1]?.trim() };
          }
        }
      }),
      concatMap((tags) => combineLatest([of(tags), from(this.dbService.bands({ Name: tags.artist }))])),
      concatMap(([tags, bands]) => combineLatest([of(tags), iif(() => !!bands.length, of(bands[0]), from(this.dbService.createBand({ Name: tags.artist })))])),
      map(([tags, band]) => this.mapTagsToAlbum(path.basename(folder), tags, band)),
      concatMap((data) => from(this.dbService.createAlbum(data))),
      map((newAlbum) => this.mapAlbumToAlbumDto(newAlbum)),
    );
  }

  private mapTagsToAlbum(folder: string, tags: NodeID3.Tags, band: Band): Prisma.AlbumCreateInput {
    const bandInput: Prisma.BandCreateNestedOneWithoutAlbumInput = {
      connect: { BandId: band.BandId },
    };

    const lyrics = !!tags.unsynchronisedLyrics?.text;

    const input: Prisma.AlbumCreateInput = {
      Folder: folder,
      Name: tags.album,
      Year: Number.isInteger(Number(tags.year)) && Number(tags.year) > 0 ? +tags.year : new Date().getFullYear(),
      Transferred: false,
      Lyrics: lyrics,
      LyricsDate: lyrics ? new Date() : null,
      Band: bandInput,
    };

    return input;
  }

  saveAlbum(album: AlbumDto): Observable<Album> {
    return from(this.dbService.updateAlbum({ where: { AlbumId: album.id }, data: this.mapAlbumDtoToAlbum(album) }));
  }

  setHasLyrics(id: number, hasLyrics: boolean): Observable<Album> {
    this.dbService
      .getLyricsHistory(id)
      .then((history) => {
        if (history) {
          this.dbService.deleteLyricsHistory({ where: { LyricsHistoryId: history.LyricsHistoryId } }).catch((error) => Logger.error(error));
        }
      })
      .catch((error) => Logger.error(error));

    return from(this.dbService.updateAlbum({ where: { AlbumId: id }, data: { Lyrics: hasLyrics } }));
  }

  setTransferred(id: number, transferred: boolean): Observable<Album> {
    return from(this.dbService.updateAlbum({ where: { AlbumId: +id }, data: { Transferred: !!transferred, TransferredDate: new Date() } }));
  }

  private mapAlbumDtoToAlbum(albumDto: AlbumDto): Partial<Album> {
    return {
      Folder: albumDto.folder,
      Lyrics: albumDto.hasLyrics,
      MetalArchiveUrl: albumDto.albumUrl,
      IgnoreMetalArchives: albumDto.ignore,
      Name: albumDto.album,
      Transferred: albumDto.transferred,
      Year: +albumDto.year,
    };
  }

  async renameFolder(id: number, src: string, dest: string): Promise<RenameFolder> {
    const folder = this.fileSystemService.filenameValidator(this.fileSystemService.getFilename(dest));
    const fullPath = `${this.basePath}/${folder}`;

    this.fileSystemService.rename(src, fullPath);
    this.dbService.updateAlbum({ where: { AlbumId: +id }, data: { Folder: folder } }).catch((error) => Logger.error(error));

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

          this.fileSystemService.rename(mp3, path.join(location, mp3s[index]));
        }
      }
    }

    return newAlbums;
  }

  deleteAlbum(id: number): Observable<boolean> {
    return this.getAlbum(id).pipe(
      tap((album) => {
        try {
          this.fileSystemService.deleteFolder(album.fullPath);
        } catch (error) {
          Logger.error(error);
        }
      }),
      mergeMap(() => from(this.dbService.deleteAlbum(id))),
      map(() => true),
      catchError((error) => {
        Logger.error(error);
        return of(false);
      }),
    );
  }
}
