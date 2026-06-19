import { AlbumDto, BASE_PATH_TOKEN, MetalArchivesSearchResponse, RenameFolder, SearchRequest, TAKE_TOKEN } from '@metal-p3/api-interfaces';
import { Album, Band, Prisma } from '@metal-p3/prisma/client';
import { AlbumWithBand, DbService } from '@metal-p3/shared/database';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { TrackService } from '@metal-p3/track/api';
import { Inject, Injectable, Logger } from '@nestjs/common';
import chokidar from 'chokidar';
import * as fs from 'fs';
import * as NodeID3 from 'node-id3';
import * as path from 'path';
import { Observable, catchError, concatMap, from, map, of } from 'rxjs';
import { AlbumGateway } from './album-gateway.service';

@Injectable()
export class AlbumService {
  constructor(
    private readonly dbService: DbService,
    private readonly fileSystemService: FileSystemService,
    private readonly trackService: TrackService,
    private readonly metalArchivesService: MetalArchivesService,
    private readonly albumGateway: AlbumGateway,
    @Inject(BASE_PATH_TOKEN) private readonly basePath: string,
    @Inject(TAKE_TOKEN) private readonly take: number,
  ) {
    if (basePath) {
      this.addFileWatcher(basePath);
    }
  }

  getAlbums(request: SearchRequest): Observable<AlbumDto[]> {
    let where: Prisma.AlbumWhereInput = {};
    let bandWhere: Prisma.BandWhereInput = {};

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

    if (request.year != null) {
      where = {
        ...where,
        Year: +request.year,
      };
    }

    if (request.hasLyrics != null) {
      const lyricsBool = request.hasLyrics === true || (request.hasLyrics as unknown as string) === 'true';
      where = {
        ...where,
        Lyrics: lyricsBool,
      };
    }

    if (request.transferred != null) {
      const transferredBool = request.transferred === true || (request.transferred as unknown as string) === 'true';
      where = {
        ...where,
        Transferred: transferredBool,
      };
    }

    if (request.played != null) {
      const playedBool = request.played === true;
      if (playedBool) {
        where = {
          ...where,
          Played: true,
        };
      } else {
        where = {
          ...where,
          OR: [{ Played: false }, { Played: null }],
        };
      }
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

  async getAlbum(id: number): Promise<AlbumDto> {
    return this.mapAlbumToAlbumDto(await this.dbService.album({ AlbumId: id }));
  }

  private mapAlbumToAlbumDto(album: AlbumWithBand | null): AlbumDto {
    if (!album) {
      throw new Error(`Album not found`);
    }

    const band = album.Band;

    if (!band) {
      throw new Error(`Album with id ${album.AlbumId} is missing associated band`);
    }

    return {
      id: album.AlbumId,
      fullPath: path.join(this.basePath, album.Folder),
      folder: album.Folder,
      bandId: band.BandId,
      artist: band.Name ?? undefined,
      album: album.Name ?? undefined,
      year: album.Year ?? undefined,
      genre: band.Genre ?? undefined,
      country: band.Country ?? undefined,
      albumUrl: album.MetalArchiveUrl ?? undefined,
      artistUrl: band.MetalArchiveUrl ?? undefined,
      ignore: album.IgnoreMetalArchives ?? false,
      transferred: album.Transferred ?? undefined,
      hasLyrics: album.Lyrics ?? undefined,
      played: album.Played ?? undefined,
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
      ignored: (p) => {
        try {
          return !fs.lstatSync(p).isDirectory();
        } catch {
          return true;
        }
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
                this.addAlbum(dirPath).subscribe({
                  next: (albumDto) => this.albumGateway.albumAddedMessage(albumDto),
                  error: (error) => Logger.error(`Failed to add album from watcher: ${error}`),
                  complete: () => this.pendingFolders.delete(folder),
                });
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

    // Step 1: Read ID3 tags and resolve (or create) the band record.
    // Step 2: Search Metal Archives for URLs, then persist the album.
    // Step 3: Rename the folder and individual track files to a canonical format.
    // Step 4: Propagate album-level Metal Archives metadata (country / albumUrl) into each track's ID3.
    return this.prepareTagsAndBand(folder, dirName).pipe(
      concatMap(({ tags, band }) => this.searchAndCreateAlbum(folder, tags, band)),
      concatMap((albumDto) => this.renameFolderAndTracks(albumDto)),
      concatMap((albumDto) => this.propagateAlbumMetadataToTracks(albumDto)),
    );
  }

  private propagateAlbumMetadataToTracks(albumDto: AlbumDto): Observable<AlbumDto> {
    if (!albumDto.country && !albumDto.albumUrl) {
      return of(albumDto);
    }

    let files: string[];
    try {
      files = this.fileSystemService
        .getFiles(albumDto.fullPath)
        .filter((f) => path.extname(f) === '.mp3')
        .map((f) => path.join(albumDto.fullPath, f));
    } catch (error) {
      Logger.error(`Failed to list files for track metadata propagation in "${albumDto.fullPath}": ${error}`);
      return of(albumDto);
    }

    if (!files.length) {
      return of(albumDto);
    }

    return this.trackService.getTracks(files).pipe(
      concatMap((tracks) => {
        const enriched = tracks.map((track) => ({
          ...track,
          artist: albumDto.artist ?? track.artist,
          album: albumDto.album ?? track.album,
          year: albumDto.year ?? track.year,
          genre: albumDto.genre ?? track.genre,
          country: albumDto.country ?? track.country,
          albumUrl: albumDto.albumUrl ?? track.albumUrl,
          artistUrl: albumDto.artistUrl ?? track.artistUrl,
        }));
        return from(this.trackService.saveTracks(enriched)).pipe(map(() => albumDto));
      }),
      catchError((error) => {
        Logger.error(`Failed to propagate album metadata to tracks for album ${albumDto.id}: ${error}`);
        return of(albumDto);
      }),
    );
  }

  private prepareTagsAndBand(folder: string, dirName: string): Observable<{ tags: NodeID3.Tags; band: Band }> {
    return this.getAlbums({ take: 1, folder: dirName, exactMatch: true }).pipe(
      // Guard against duplicate folder entries in the database.
      map((albums) => {
        if (albums.length) {
          throw new Error('folder already exists');
        }
      }),
      map(() => {
        // Flatten any sub-folders so all files are accessible at the root level.
        this.fileSystemService.moveFilesToTheRoot(folder, folder);

        const mp3 = this.fileSystemService.getFiles(folder).find((f) => path.extname(f) === '.mp3');

        if (!mp3) {
          throw new Error('no mp3 files found in folder');
        }

        const tags = this.trackService.getTags(path.join(folder, mp3));

        // Fall back to parsing artist/album from the folder name ("Artist - Album") when tags are missing.
        if (tags.artist) {
          return tags;
        }

        const folderSplit = this.fileSystemService.getFilename(folder).split('-');
        return { ...tags, artist: folderSplit[0].trim(), album: folderSplit?.[1]?.trim() ?? '' };
      }),
      concatMap((tags) =>
        // Look up an existing band record, or create a new one if none exists.
        from(this.dbService.bands({ Name: tags.artist })).pipe(
          concatMap((bands) => (bands.length ? of(bands[0]) : from(this.dbService.createBand({ Name: tags.artist ?? '' })))),
          map((band) => ({ tags, band })),
        ),
      ),
    );
  }

  private searchAndCreateAlbum(folder: string, tags: NodeID3.Tags, band: Band): Observable<AlbumDto> {
    const artist = tags.artist;
    const album = tags.album;

    // Search Metal Archives for matching artist/album URLs. Errors are non-fatal —
    // the album is still created without URLs if the search fails.
    const maSearch$ =
      artist && album
        ? this.metalArchivesService.findUrl(artist, album).pipe(
            map((response: MetalArchivesSearchResponse) => this.extractMetalArchivesUrls(response)),
            catchError((error) => {
              Logger.error(`Failed to find Metal Archives URL: ${error}`);
              return of<{ artistUrl?: string; albumUrl?: string }>({});
            }),
          )
        : of<{ artistUrl?: string; albumUrl?: string }>({});

    return maSearch$.pipe(
      concatMap(({ artistUrl, albumUrl }) => {
        // Persist the album with the album URL included in the initial write,
        // avoiding a separate updateAlbum call later.
        const data = this.mapTagsToAlbum(path.basename(folder), tags, band, albumUrl);
        return from(this.dbService.createAlbum(data)).pipe(
          map((newAlbum) => this.mapAlbumToAlbumDto(newAlbum)),
          concatMap((albumDto) => {
            // Update the band record if we have a new artist URL, or if country/genre are missing.
            if (artistUrl && band.BandId && (!band.MetalArchiveUrl || !band.Country || !band.Genre)) {
              // Only fetch band props from Metal Archives when country or genre are absent.
              const needsBandProps = !band.Country || !band.Genre;
              const bandProps$ =
                needsBandProps && artistUrl
                  ? this.metalArchivesService.getBandProps(artistUrl).pipe(
                      catchError((error) => {
                        Logger.error(`Failed to fetch band props: ${error}`);
                        return of<{ genre?: string; country?: string }>({});
                      }),
                    )
                  : of<{ genre?: string; country?: string }>({});

              return bandProps$.pipe(
                concatMap(({ genre, country }) => {
                  // Only set fields that are currently empty — never overwrite existing values.
                  const bandUpdate: Prisma.BandUpdateInput = {
                    ...(!band.MetalArchiveUrl && { MetalArchiveUrl: artistUrl }),
                    ...(!band.Country && country && { Country: country }),
                    ...(!band.Genre && genre && { Genre: genre }),
                  };
                  return from(this.dbService.updateBand({ where: { BandId: band.BandId }, data: bandUpdate })).pipe(
                    map((updatedBand) => ({
                      ...albumDto,
                      artistUrl,
                      country: updatedBand.Country ?? albumDto.country,
                      genre: updatedBand.Genre ?? albumDto.genre,
                    })),
                  );
                }),
              );
            }
            return of(albumDto);
          }),
        );
      }),
    );
  }

  private renameFolderAndTracks(albumDto: AlbumDto): Observable<AlbumDto> {
    if (!albumDto.artist || !albumDto.album) {
      return of(albumDto);
    }

    const dest = `${albumDto.artist} - ${albumDto.album}`;
    const expectedFolder = this.fileSystemService.filenameValidator(dest);

    // Skip the filesystem rename if the folder already matches the canonical name.
    if (albumDto.folder === expectedFolder) {
      return this.renameAlbumTracks(albumDto);
    }

    // Rename the folder on disk and update the database, then rename the tracks inside.
    return from(this.renameFolder(albumDto.id, albumDto.fullPath, dest)).pipe(
      map(({ fullPath, folder }) => ({ ...albumDto, fullPath, folder })),
      catchError((error) => {
        Logger.error(`Failed to rename folder for album ${albumDto.id}: ${error}`);
        return of(albumDto);
      }),
      concatMap((updated) => this.renameAlbumTracks(updated)),
    );
  }

  private renameAlbumTracks(albumDto: AlbumDto): Observable<AlbumDto> {
    let files: string[];

    try {
      files = this.fileSystemService
        .getFiles(albumDto.fullPath)
        .filter((f) => path.extname(f) === '.mp3')
        .map((f) => path.join(albumDto.fullPath, f));
    } catch (error) {
      Logger.error(`Failed to list files for track rename in "${albumDto.fullPath}": ${error}`);
      return of(albumDto);
    }

    if (!files.length) {
      return of(albumDto);
    }

    // Read tags for all tracks, then rename each file to its canonical name.
    // Individual rename failures are logged and skipped rather than aborting the whole batch.
    return this.trackService.getTracks(files).pipe(
      map((tracks) => {
        for (const track of tracks) {
          try {
            this.trackService.renameTrack(track);
          } catch (error) {
            Logger.error(`Failed to rename track "${track.fullPath}": ${error}`);
          }
        }
        return albumDto;
      }),
      catchError((error) => {
        Logger.error(`Failed to rename tracks for album ${albumDto.id}: ${error}`);
        return of(albumDto);
      }),
    );
  }

  private extractMetalArchivesUrls(response: MetalArchivesSearchResponse): { artistUrl?: string; albumUrl?: string } {
    if (response.iTotalRecords === 1 && response.results.length === 1) {
      return { artistUrl: response.results[0].artistUrl, albumUrl: response.results[0].albumUrl };
    }

    if (response.iTotalRecords > 1) {
      const fullLengths = response.results.filter((r) => r.releaseType === 'Full-length');
      if (fullLengths.length === 1) {
        return { artistUrl: fullLengths[0].artistUrl, albumUrl: fullLengths[0].albumUrl };
      }
    }

    return {};
  }

  private mapTagsToAlbum(folder: string, tags: NodeID3.Tags, band: Band, albumUrl?: string): Prisma.AlbumCreateInput {
    const bandInput: Prisma.BandCreateNestedOneWithoutAlbumInput = {
      connect: { BandId: band.BandId },
    };

    const lyrics = !!tags.unsynchronisedLyrics?.text;

    return {
      Folder: folder,
      Name: tags.album,
      Year: Number.isInteger(Number(tags.year)) && Number(tags.year) > 0 ? Number(tags.year) : new Date().getFullYear(),
      Transferred: false,
      Lyrics: lyrics,
      LyricsDate: lyrics ? new Date() : null,
      Band: bandInput,
      ...(albumUrl && { MetalArchiveUrl: albumUrl }),
    };
  }

  async saveAlbum(album: AlbumDto): Promise<Album> {
    return this.dbService.updateAlbum({ where: { AlbumId: album.id }, data: this.mapAlbumDtoToAlbum(album) });
  }

  async setHasLyrics(id: number, hasLyrics: boolean): Promise<Album> {
    // fire-and-forget: clean up lyrics history without blocking the response
    void this.dbService
      .getLyricsHistory(id)
      .then((history) => (history ? this.dbService.deleteLyricsHistory({ where: { LyricsHistoryId: history.LyricsHistoryId } }) : null))
      .catch((error) => Logger.error(`Failed to clean up lyrics history for album ${id}: ${error}`));

    return this.dbService.updateAlbum({ where: { AlbumId: id }, data: { Lyrics: hasLyrics } });
  }

  async setTransferred(id: number, transferred: boolean): Promise<Album> {
    return this.dbService.updateAlbum({ where: { AlbumId: +id }, data: { Transferred: !!transferred, TransferredDate: new Date(), Played: true } });
  }

  async setPlayed(id: number, played: boolean): Promise<Album> {
    return this.dbService.updateAlbum({ where: { AlbumId: +id }, data: { Played: played } });
  }

  private mapAlbumDtoToAlbum(albumDto: AlbumDto): Partial<Album> {
    return {
      Folder: albumDto.folder,
      Lyrics: albumDto.hasLyrics,
      MetalArchiveUrl: albumDto.albumUrl,
      IgnoreMetalArchives: albumDto.ignore,
      Name: albumDto.album,
      Transferred: albumDto.transferred,
      Year: Number(albumDto.year),
      Played: albumDto.played,
      BandId: albumDto.bandId || null,
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

  async deleteAlbum(id: number): Promise<boolean> {
    try {
      const album = await this.getAlbum(id);
      try {
        this.fileSystemService.deleteFolder(album.fullPath);
      } catch (error) {
        Logger.error(error);
      }
      await this.dbService.deleteAlbum(id);
      return true;
    } catch (error) {
      Logger.error(error);
      return false;
    }
  }
}
