import { Injectable } from '@nestjs/common';
import { Album, Band, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

@Injectable()
export class DbService {
  constructor(private readonly prisma: PrismaService) {}

  async albums(params: { skip?: number; take?: number; cursor?: Prisma.AlbumWhereUniqueInput; where?: Prisma.AlbumWhereInput; orderBy?: Prisma.AlbumOrderByInput }): Promise<Album[]> {
    const { skip, take, cursor, where, orderBy } = params;

    return this.prisma.album.findMany({
      skip,
      take: +take,
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
}
