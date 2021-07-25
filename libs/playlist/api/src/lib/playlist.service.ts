import { PlaylistDto, PlaylistItemDto } from '@metal-p3/player/domain';
import { DbService } from '@metal-p3/shared/database';
import { Injectable, Logger } from '@nestjs/common';
import { Playlist, PlaylistItem, Prisma } from '@prisma/client';
import { from, Observable, of } from 'rxjs';
import { catchError, map, mapTo } from 'rxjs/operators';

@Injectable()
export class PlaylistService {
  constructor(private readonly dbService: DbService) {}

  getPlaylists(): Observable<PlaylistDto[]> {
    return from(this.dbService.getPlaylists()).pipe(map((playlists) => playlists.map((playlist) => this.playlistToDto(playlist))));
  }

  getPlaylist(playlistId: number): Observable<PlaylistDto> {
    return from(this.dbService.getPlaylist(playlistId)).pipe(map((playlist) => this.playlistToDto(playlist)));
  }

  private playlistToDto(playlist: Playlist): PlaylistDto {
    const items: PlaylistItem[] = playlist['PlaylistItem'];

    return {
      id: playlist.PlaylistId,
      name: playlist.PlaylistName,
      items: items.map((item) => this.playlistItemToDto(item)),
    };
  }

  private playlistItemToDto(playlistItem: PlaylistItem): PlaylistItemDto {
    return {
      id: playlistItem.PlaylistItemId,
      playlistId: playlistItem.PlaylistId,
      itemPath: playlistItem.ItemPath,
    };
  }

  private getPlaylistItemInput(items: PlaylistItemDto[]): Prisma.PlaylistItemCreateNestedManyWithoutPlaylistInput {
    const playlistItemInput: Prisma.PlaylistItemCreateNestedManyWithoutPlaylistInput = {
      createMany: {
        data: items.map((item) => ({ ItemPath: item.itemPath })),
      },
    };

    return playlistItemInput;
  }

  createPlaylist(playlist: PlaylistDto): Observable<PlaylistDto> {
    return from(this.dbService.createPlaylist({ PlaylistName: playlist.name, PlaylistItem: this.getPlaylistItemInput(playlist.items) })).pipe(
      map((playlist: Playlist) => this.playlistToDto(playlist)),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      })
    );
  }

  deletePlaylist(playlistId: number): Observable<boolean | Error> {
    return from(this.dbService.deletePlaylist({ where: { PlaylistId: playlistId } })).pipe(
      mapTo(true),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      })
    );
  }
}
