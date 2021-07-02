import { MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { DbService } from '@metal-p3/shared/database';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { Injectable, Logger } from '@nestjs/common';
import { Album, LyricsHistory, Prisma } from '@prisma/client';
import { from, Observable, of } from 'rxjs';
import { catchError, concatMap, finalize, map, mapTo, tap, toArray } from 'rxjs/operators';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Injectable()
export class LyricsService {
  constructor(private readonly dbService: DbService, private readonly metalArchivesService: MetalArchivesService, private readonly maintenanceGateway: MaintenanceGateway) {}

  getHistory(): Observable<LyricsHistoryDto[]> {
    return from(this.dbService.lyricsHistory()).pipe(map((history) => history.map(this.lyricsHistoryToDto)));
  }

  getPriority(): Observable<LyricsHistoryDto[]> {
    return from(this.dbService.lyricsPriority()).pipe(map((history) => history.map(this.lyricsHistoryToDto)));
  }

  private lyricsHistoryToDto(history: LyricsHistory): LyricsHistoryDto {
    const album = history['Album'] as Album;

    return {
      id: history.LyricsHistoryId,
      albumId: album.AlbumId,
      numTracks: history.NumTracks,
      numLyrics: history.NumLyrics,
      numLyricsHistory: history.NumLyricsHistory,
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
          : from(this.dbService.createLyricsHistory({ Priority: true, Album: this.getAlbumInput(albumId) }))
      ),
      map((history) => this.lyricsHistoryToDto(history))
    );
  }

  setChecked(id: number, checked: boolean): Observable<LyricsHistoryDto> {
    return from(this.dbService.updateLyricsHistory({ where: { LyricsHistoryId: id }, data: { Checked: checked } })).pipe(map((history) => this.lyricsHistoryToDto(history)));
  }

  checkPriority(): Observable<LyricsHistoryDto[]> {
    return this.checkLyrics(this.getPriority()).pipe(finalize(() => this.maintenanceGateway.lyricsHistoryComplete()));
  }

  checkLyrics(source$: Observable<LyricsHistoryDto[]>): Observable<LyricsHistoryDto[]> {
    return source$.pipe(
      concatMap((history) =>
        from(history).pipe(
          concatMap((history) =>
            this.metalArchivesService.getTracks(history.url).pipe(
              map((maTracks) => this.mapLyrics(history, maTracks)),
              tap((history) =>
                this.dbService.updateLyricsHistory({
                  where: { LyricsHistoryId: history.id },
                  data: { NumLyrics: history.numLyrics, NumTracks: history.numTracks, NumLyricsHistory: history.numLyricsHistory, Checked: history.checked },
                })
              ),
              catchError((error) => {
                Logger.error(error);
                return of({ ...history, error });
              }),
              tap((history) => this.maintenanceGateway.lyricsHistoryMessage(history)),
              toArray()
            )
          )
        )
      )
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
      mapTo(true),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      })
    );
  }
}
