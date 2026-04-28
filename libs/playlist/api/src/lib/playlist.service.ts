import { PlaylistDto, PlaylistItemDto } from '@metal-p3/playlist/domain';
import { PlaylistItem, Prisma } from '@metal-p3/prisma/client';
import { DbService, PlaylistWithItems } from '@metal-p3/shared/database';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

@Injectable()
export class PlaylistService {
  constructor(private readonly dbService: DbService) {}

  async getPlaylists(): Promise<PlaylistDto[]> {
    const playlists = await this.dbService.getPlaylists();
    return playlists.map((playlist) => this.playlistToDto(playlist));
  }

  async getPlaylist(playlistId: number): Promise<PlaylistDto> {
    const playlist = await this.dbService.getPlaylist(playlistId);
    if (!playlist) throw new NotFoundException(`Playlist ${playlistId} not found`);
    return this.playlistToDto(playlist);
  }

  private playlistToDto(playlist: PlaylistWithItems): PlaylistDto {
    const items: PlaylistItem[] = playlist.PlaylistItem;

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

  async createPlaylist(playlist: PlaylistDto): Promise<PlaylistDto> {
    try {
      const result = await this.dbService.createPlaylist({ PlaylistName: playlist.name, PlaylistItem: this.getPlaylistItemInput(playlist.items) });
      return this.playlistToDto(result);
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException((error as Error).message);
    }
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

  async updatePlaylist(playlist: PlaylistDto): Promise<PlaylistDto> {
    try {
      const result = await this.dbService.updatePlaylist({ where: { PlaylistId: playlist.id }, data: { PlaylistName: playlist.name, PlaylistItem: this.getPlaylistUpdateInput(playlist.items) } });
      return this.playlistToDto(result);
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async removeItem(itemId: number): Promise<boolean> {
    try {
      await this.dbService.removePlaylistItem({ where: { PlaylistItemId: itemId } });
      return true;
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async deletePlaylist(playlistId: number): Promise<boolean> {
    try {
      await this.dbService.deletePlaylist({ where: { PlaylistId: playlistId } });
      return true;
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}
