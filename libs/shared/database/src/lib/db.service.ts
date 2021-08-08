import { Injectable, UseFilters } from '@nestjs/common';
import { Album, Band, LyricsHistory, Playlist, PlaylistItem, Prisma } from '@prisma/client';
import { DbExceptionsFilter } from './db-exceptions-filter';
import { PrismaService } from './prisma.service';

@UseFilters(new DbExceptionsFilter())
@Injectable()
export class DbService {
  constructor(private readonly prisma: PrismaService) {}

  async albums(params: { skip?: number; take?: number; cursor?: Prisma.AlbumWhereUniqueInput; where?: Prisma.AlbumWhereInput; orderBy?: Prisma.AlbumOrderByInput }): Promise<Album[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.album.findMany({
      skip,
      take: +(take || 0),
      cursor,
      where,
      orderBy,
      include: {
        Band: true,
      },
    });
  }

  async album(albumWhereUniqueInput: Prisma.AlbumWhereUniqueInput): Promise<Album | null> {
    return this.prisma.album.findUnique({
      where: albumWhereUniqueInput,
      include: {
        Band: true,
      },
    });
  }

  async createAlbum(data: Prisma.AlbumCreateInput): Promise<Album> {
    return this.prisma.album.create({
      data,
      include: {
        Band: true,
      },
    });
  }

  async updateAlbum(params: { where: Prisma.AlbumWhereUniqueInput; data: Prisma.AlbumUpdateInput }): Promise<Album> {
    const { where, data } = params;
    return this.prisma.album.update({
      data,
      where,
    });
  }

  async deleteAlbum(id: number) {
    return this.prisma.album.delete({ where: { AlbumId: id } });
  }

  async bands(where: Prisma.BandWhereInput): Promise<Band[]> {
    return this.prisma.band.findMany({
      where,
    });
  }

  async band(bandWhereUniqueInput: Prisma.BandWhereUniqueInput): Promise<Band | null> {
    return this.prisma.band.findUnique({
      where: bandWhereUniqueInput,
    });
  }

  async createBand(data: Prisma.BandCreateInput): Promise<Band> {
    return this.prisma.band.create({ data });
  }

  async updateBand(params: { where: Prisma.BandWhereUniqueInput; data: Prisma.BandUpdateInput }): Promise<Band> {
    const { where, data } = params;
    return this.prisma.band.update({
      data,
      where,
    });
  }

  async lyricsHistory(): Promise<Album[]> {
    return this.prisma.album.findMany({
      where: {
        MetalArchiveUrl: {
          not: null,
        },
        Lyrics: false,
        Year: {
          gt: new Date().getFullYear() - 4,
        },
      },
      include: { LyricsHistory: true },
    });
  }

  async lyricsPriority(): Promise<LyricsHistory[]> {
    return this.prisma.lyricsHistory.findMany({
      where: {
        Priority: true,
        Album: {
          MetalArchiveUrl: {
            not: null,
          },
        },
      },
      include: { Album: true },
    });
  }

  async getLyricsHistory(albumId: number): Promise<LyricsHistory | null> {
    return this.prisma.lyricsHistory.findFirst({ where: { AlbumId: albumId } });
  }

  async createLyricsHistory(data: Prisma.LyricsHistoryCreateInput): Promise<LyricsHistory> {
    return this.prisma.lyricsHistory.create({
      data,
      include: {
        Album: true,
      },
    });
  }

  async updateLyricsHistory(params: { where: Prisma.LyricsHistoryWhereUniqueInput; data: Prisma.LyricsHistoryUpdateInput }): Promise<LyricsHistory> {
    const { where, data } = params;

    return this.prisma.lyricsHistory.update({
      data,
      where,
      include: {
        Album: true,
      },
    });
  }

  async deleteLyricsHistory(params: { where: Prisma.LyricsHistoryWhereUniqueInput }): Promise<LyricsHistory> {
    const { where } = params;

    return this.prisma.lyricsHistory.delete({
      where,
    });
  }

  async getPlaylists(): Promise<Playlist[]> {
    return this.prisma.playlist.findMany({ include: { PlaylistItem: true } });
  }

  async getPlaylist(playlistId: number): Promise<Playlist | null> {
    return this.prisma.playlist.findFirst({ where: { PlaylistId: playlistId } });
  }

  async createPlaylist(data: Prisma.PlaylistCreateInput): Promise<Playlist> {
    return this.prisma.playlist.create({
      data,
      include: {
        PlaylistItem: true,
      },
    });
  }

  async updatePlaylist(params: { where: Prisma.PlaylistWhereUniqueInput; data: Prisma.PlaylistUpdateInput }): Promise<Playlist> {
    const { where, data } = params;

    return this.prisma.playlist.update({
      data,
      where,
      include: {
        PlaylistItem: true,
      },
    });
  }

  async removePlaylistItem(params: { where: Prisma.PlaylistItemWhereUniqueInput }): Promise<PlaylistItem> {
    const { where } = params;

    return this.prisma.playlistItem.delete({
      where,
    });
  }

  async deletePlaylist(params: { where: Prisma.PlaylistWhereUniqueInput }): Promise<Playlist> {
    const { where } = params;

    return this.prisma.playlist.delete({
      where,
    });
  }

  async folders(): Promise<Partial<Album>[]> {
    return this.prisma.album.findMany({ select: { AlbumId: true, Folder: true } });
  }

  async missingUrls(): Promise<Partial<Album>[]> {
    return this.prisma.album.findMany({
      select: { AlbumId: true, Name: true, Band: { select: { BandId: true, Name: true, MetalArchiveUrl: true } } },
      where: { IgnoreMetalArchives: null, MetalArchiveUrl: null, Lyrics: false },
      orderBy: { Folder: 'asc' },
    });
  }
}
