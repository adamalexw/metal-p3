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
import { Observable, catchError, combineLatest, concatMap, from, iif, map, mergeMap, of, tap } from 'rxjs';
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

  private readonly pendingFolders = new Set<string>();

  private addFileWatcher(basePath: string) {
    const watcher = chokidar.watch(basePath, {
      depth: 0,
      ignored: (path) => {
        return !fs.existsSync(path) || !this.fileSystemService.isFolder(path);
      },
      ignoreInitial: true,
    });

    watcher.on('ready', () => console.log('Initial scan complete. Ready for changes', new Date().toLocaleString()));

    watcher.on('addDir', (dirPath) => {
      const folder = this.fileSystemService.getFilename(dirPath);

      // Guard synchronously before any async work — prevents duplicate processing
      // when chokidar fires multiple addDir events for the same directory.
      if (this.pendingFolders.has(folder)) {
        return;
      }
      this.pendingFolders.add(folder);

      // ensure we aren't renaming an existing folder
      this.dbService
        .albums({ take: 1, where: { Folder: folder } })
        .then((album) => {
          if (!album.length) {
            this.waitForFolderStable(dirPath)
              .then(() => {
                this.albumGateway.albumAddedMessage(this.fileSystemService.getFilename(dirPath));
              })
              .catch((error) => Logger.error(error))
              .finally(() => this.pendingFolders.delete(folder));
          } else {
            this.pendingFolders.delete(folder);
          }
        })
        .catch((error) => {
          Logger.error(error);
          this.pendingFolders.delete(folder);
        });
    });

    watcher.on('error', (error) => Logger.error(`Watcher error: ${error}`));
  }

  /**
   * Polls a folder until its total size and file count stop changing,
   * indicating that an unzip or copy operation has completed.
   */
  private waitForFolderStable(folderPath: string, stabilityThreshold = 5000, pollInterval = 1000): Promise<void> {
    return new Promise((resolve) => {
      let lastSnapshot = '';
      let stableSince: number | null = null;

      const check = () => {
        try {
          const snapshot = this.getFolderSnapshot(folderPath);

          if (snapshot === lastSnapshot) {
            if (!stableSince) {
              stableSince = Date.now();
            } else if (Date.now() - stableSince >= stabilityThreshold) {
              resolve();
              return;
            }
          } else {
            lastSnapshot = snapshot;
            stableSince = null;
          }
        } catch (error) {
          Logger.error(`Error checking folder stability: ${error}`);
        }

        setTimeout(check, pollInterval);
      };

      // initial delay to let the OS create the first files
      setTimeout(check, pollInterval);
    });
  }

  private getFolderSnapshot(folderPath: string): string {
    let fileCount = 0;
    let totalSize = 0;

    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              walk(fullPath);
            } else {
              fileCount++;
              totalSize += stat.size;
            }
          } catch {
            // file may be in-flight, ignore
          }
        }
      } catch {
        // directory may not be readable yet
      }
    };

    walk(folderPath);
    return `${fileCount}:${totalSize}`;
  }

  addAlbum(folder: string): Observable<AlbumDto> {
    const dirName = this.fileSystemService.getFilename(folder);

    return this.getAlbums({ take: 1, folder: dirName, exactMatch: true }).pipe(
      map((album) => {
        if (album.length) {
          throw new Error('folder already exists');
        }
      }),
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
    from(this.dbService.getLyricsHistory(id))
      .pipe(
        concatMap((history) => (history ? from(this.dbService.deleteLyricsHistory({ where: { LyricsHistoryId: history.LyricsHistoryId } })) : of(null))),
        catchError((error) => {
          Logger.error(`Failed to clean up lyrics history for album ${id}: ${error}`);
          return of(null);
        }),
      )
      .subscribe();

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

    try {
      this.fileSystemService.rename(src, fullPath);
    } catch (error) {
      Logger.error(`Failed to rename folder from "${src}" to "${fullPath}": ${error}`);
      throw new Error(`Failed to rename folder: ${error}`);
    }

    try {
      await this.dbService.updateAlbum({ where: { AlbumId: +id }, data: { Folder: folder } });
    } catch (error) {
      Logger.error(`Folder renamed but failed to update database for album ${id}: ${error}`);

      // attempt to revert the filesystem rename
      try {
        this.fileSystemService.rename(fullPath, src);
      } catch (revertError) {
        Logger.error(`Failed to revert folder rename from "${fullPath}" to "${src}": ${revertError}`);
      }

      throw new Error(`Failed to update database after rename: ${error}`);
    }

    return { fullPath, folder };
  }

  createAlbumFromRootFiles(basePath: string): string[] {
    const newAlbums: string[] = [];
    const files = this.fileSystemService.getFiles(basePath);
    const mp3s = files.filter((f) => path.extname(f).toLowerCase() === '.mp3');

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

    // Remove any non-.mp3 files left at the root (e.g. cover images, text files)
    const remaining = this.fileSystemService.getFiles(basePath);
    for (const file of remaining) {
      const filePath = path.join(basePath, file);
      if (!this.fileSystemService.isFolder(filePath) && path.extname(file).toLowerCase() !== '.mp3') {
        try {
          this.fileSystemService.deleteFile(filePath);
        } catch (error) {
          Logger.error(`Failed to delete root file "${filePath}": ${error}`);
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
