import { PlaylistDto, PlaylistItemDto } from '@metal-p3/playlist/domain';
import { DbService } from '@metal-p3/shared/database';
import { Injectable, Logger } from '@nestjs/common';
import { Playlist, PlaylistItem, Prisma } from '@prisma/client';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
      items: items.map((item) => this.playlistItemToDto(item)).sort((a, b) => a.itemIndex - b.itemIndex),
    };
  }

  private playlistItemToDto(playlistItem: PlaylistItem): PlaylistItemDto {
    return {
      id: playlistItem.PlaylistItemId,
      playlistId: playlistItem.PlaylistId,
      itemPath: playlistItem.ItemPath,
      itemIndex: playlistItem.ItemIndex,
    };
  }

  private playlistItemDtoToPrisma(dto: PlaylistItemDto): Prisma.PlaylistItemCreateManyPlaylistInput | Prisma.PlaylistItemUpdateManyMutationInput {
    return { ItemPath: dto.itemPath, ItemIndex: dto.itemIndex };
  }

  private getPlaylistItemInput(items: PlaylistItemDto[]): Prisma.PlaylistItemCreateNestedManyWithoutPlaylistInput {
    const playlistItemInput: Prisma.PlaylistItemCreateNestedManyWithoutPlaylistInput = {
      createMany: {
        data: items.map((item) => this.playlistItemDtoToPrisma(item) as Prisma.PlaylistItemCreateManyPlaylistInput),
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
      }),
    );
  }

  private getPlaylistUpdateInput(items: PlaylistItemDto[]): Prisma.PlaylistItemUpdateManyWithoutPlaylistNestedInput {
    const playlistUpdateInput: Prisma.PlaylistItemUpdateManyWithoutPlaylistNestedInput = {
      updateMany: items.filter((item) => item.id > 0).map((item) => ({ where: { PlaylistItemId: item.id }, data: this.playlistItemDtoToPrisma(item) as Prisma.PlaylistItemUpdateManyMutationInput })),
    };

    const newItems = items.filter((item) => item.id === -1);

    if (newItems) {
      playlistUpdateInput.createMany = {
        data: newItems.map((item) => this.playlistItemDtoToPrisma(item) as Prisma.PlaylistItemCreateManyPlaylistInput),
      };
    }

    return playlistUpdateInput;
  }

  updatePlaylist(playlist: PlaylistDto): Observable<PlaylistDto> {
    return from(this.dbService.updatePlaylist({ where: { PlaylistId: playlist.id }, data: { PlaylistName: playlist.name, PlaylistItem: this.getPlaylistUpdateInput(playlist.items) } })).pipe(
      map((playlist: Playlist) => this.playlistToDto(playlist)),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      }),
    );
  }

  removeItem(itemId: number): Observable<boolean | Error> {
    return from(this.dbService.removePlaylistItem({ where: { PlaylistItemId: itemId } })).pipe(
      map(() => true),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      }),
    );
  }

  deletePlaylist(playlistId: number): Observable<boolean | Error> {
    return from(this.dbService.deletePlaylist({ where: { PlaylistId: playlistId } })).pipe(
      map(() => true),
      catchError((error) => {
        Logger.error(error);
        return of(error);
      }),
    );
  }
}
