import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { DbService } from '@metal-p3/shared/database';
import { Injectable } from '@nestjs/common';
import { Album, LyricsHistory, Prisma } from '@prisma/client';
import { from, Observable } from 'rxjs';
import { concatMap, map, tap } from 'rxjs/operators';

@Injectable()
export class LyricsService {
  constructor(private readonly dbService: DbService) {}

  getHistory(): Observable<LyricsHistoryDto[]> {
    return from(this.dbService.lyricsHistory()).pipe(map((history) => history.map(this.lyricsHistoryToDto)));
  }

  getPriority(): Observable<LyricsHistoryDto[]> {
    return from(this.dbService.lyricsPriority()).pipe(map((history) => history.map(this.lyricsHistoryToDto)));
  }

  private lyricsHistoryToDto(history: LyricsHistory): LyricsHistoryDto {
    console.log('🚀 ~ file: lyrics.service.ts ~ line 21 ~ LyricsService ~ lyricsHistoryToDto ~ history', history);
    const album = history['Album'] as Album;

    return {
      lyricsHistoryId: history.LyricsHistoryId,
      albumId: album.AlbumId,
      numTracks: history.NumTracks,
      numLyrics: history.NumLyrics,
      numLyricsHistory: history.NumLyricsHistory,
      folder: album.Folder,
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
      map((history) => this.lyricsHistoryToDto(history)),
      tap(console.log)
    );
  }
}
