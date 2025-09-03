import { MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { Album, LyricsHistory, Prisma } from '@metal-p3/prisma/client';
import { DbService } from '@metal-p3/shared/database';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { Injectable, Logger } from '@nestjs/common';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, concatMap, finalize, map, takeUntil, tap, toArray } from 'rxjs/operators';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Injectable()
export class LyricsService {
  notifier = new Subject<void>();

  constructor(
    private readonly dbService: DbService,
    private readonly metalArchivesService: MetalArchivesService,
    private readonly maintenanceGateway: MaintenanceGateway,
  ) {}

  getHistory(): Observable<LyricsHistoryDto[]> {
    return from(this.dbService.lyricsHistory()).pipe(
      map((album) => album.map((album) => this.lyricsHistoryToDto(album, album['LyricsHistory'] && album['LyricsHistory'].length && album['LyricsHistory'][0]))),
    );
  }

  getPriority(): Observable<LyricsHistoryDto[]> {
    return from(this.dbService.lyricsPriority()).pipe(map((history) => history.map((history) => this.lyricsHistoryToDto(history['Album'], history))));
  }

  private lyricsHistoryToDto(album: Album, history: LyricsHistory | undefined): LyricsHistoryDto {
    return {
      id: history?.LyricsHistoryId || album.AlbumId,
      albumId: album.AlbumId,
      numTracks: history?.NumTracks || 0,
      numLyrics: history?.NumLyrics || 0,
      numLyricsHistory: history?.NumLyricsHistory || 0,
      checked: history.Checked,
      folder: album.Folder,
      year: album.Year,
      url: album.MetalArchiveUrl,
    };
  }

  private getAlbumInput(albumId: number): Prisma.AlbumCreateNestedOneWithoutLyricsHistoryInput {
    const albumInput: Prisma.AlbumCreateNestedOneWithoutLyricsHistoryInput = {
      connect: { AlbumId: albumId },
    };

    return albumInput;
  }

  addPriority(albumId: number): Observable<LyricsHistoryDto> {
    return from(this.dbService.getLyricsHistory(albumId)).pipe(
      concatMap((history) =>
        history
          ? from(this.dbService.updateLyricsHistory({ where: { LyricsHistoryId: history.LyricsHistoryId }, data: { Priority: true } }))
          : from(this.dbService.createLyricsHistory({ Priority: true, Album: this.getAlbumInput(albumId) })),
      ),
      map((history) => this.lyricsHistoryToDto(history['Album'], history)),
    );
  }

  setChecked(id: number, checked: boolean): Observable<LyricsHistoryDto> {
    return from(this.dbService.updateLyricsHistory({ where: { LyricsHistoryId: id }, data: { Checked: checked } })).pipe(map((history) => this.lyricsHistoryToDto(history['Album'], history)));
  }

  checkPriority(): Observable<LyricsHistoryDto[]> {
    this.notifier = new Subject<void>();
    return this.checkLyrics(this.getPriority()).pipe(
      takeUntil(this.notifier),
      finalize(() => this.maintenanceGateway.lyricsHistoryComplete()),
    );
  }

  checkHistory(): Observable<LyricsHistoryDto[]> {
    this.notifier = new Subject();
    return this.checkLyrics(this.getHistory()).pipe(
      takeUntil(this.notifier),
      finalize(() => this.maintenanceGateway.lyricsHistoryComplete()),
    );
  }

  cancelHistoryCheck() {
    this.notifier.next();
    this.notifier.complete();
  }

  checkLyrics(source$: Observable<LyricsHistoryDto[]>): Observable<LyricsHistoryDto[]> {
    return source$.pipe(
      concatMap((history) =>
        from(history).pipe(
          concatMap((history) =>
            this.metalArchivesService.getTracks(history.url).pipe(
              map((maTracks) => this.mapLyrics(history, maTracks)),
              tap((history) => {
                // no existing history so create it
                if (history.id === history.albumId) {
                  this.dbService.createLyricsHistory({
                    NumLyrics: history.numLyrics,
                    NumTracks: history.numTracks,
                    NumLyricsHistory: history.numLyricsHistory,
                    Checked: history.checked,
                    Album: this.getAlbumInput(history.albumId),
                  });
                } else {
                  this.dbService.updateLyricsHistory({
                    where: { LyricsHistoryId: history.id },
                    data: { NumLyrics: history.numLyrics, NumTracks: history.numTracks, NumLyricsHistory: history.numLyricsHistory, Checked: history.checked },
                  });
                }
              }),
              catchError((error) => {
                Logger.error(error);
                return of({ ...history, error });
              }),
              tap((history) => this.maintenanceGateway.lyricsHistoryMessage(history)),
              toArray(),
            ),
          ),
        ),
      ),
    );
  }

  private mapLyrics(history: LyricsHistoryDto, maTracks: MetalArchivesAlbumTrack[]): LyricsHistoryDto {
    history.numLyricsHistory = history.numLyrics;
    const numLyrics = maTracks.filter((ma) => ma.hasLyrics).length;
    history.numLyrics = numLyrics;
    history.numTracks = maTracks.length;
    history.checked = numLyrics !== history.numLyricsHistory ? false : history.checked;

    return history;
  }

  deleteHistory(id: number): Observable<boolean | Error> {
    return from(this.dbService.deleteLyricsHistory({ where: { LyricsHistoryId: id } })).pipe(
      map(() => true),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      }),
    );
  }
}
