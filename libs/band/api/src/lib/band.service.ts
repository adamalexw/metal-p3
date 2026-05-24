import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Band, Prisma } from '@metal-p3/prisma/client';
import { BandWithAlbumCount, DbService } from '@metal-p3/shared/database';
import { MetalArchivesService } from '@metal-p3/shared/metal-archives';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BandService {
  constructor(
    private readonly dbService: DbService,
    private readonly metalArchivesService: MetalArchivesService,
  ) {}

  async getBands(request: { criteria?: string }): Promise<BandDto[]> {
    let where: Prisma.BandWhereInput = {};

    if (request.criteria) {
      where = {
        Name: { contains: request.criteria },
      };
    }

    const bands = await this.dbService.bands(where);
    return bands.map((band) => this.mapBandToBandDto(band));
  }

  async getBand(id: number): Promise<BandDto> {
    const band = await this.dbService.band({ BandId: id });
    if (!band) throw new NotFoundException(`Band ${id} not found`);
    return this.mapBandToBandDto(band);
  }

  private mapBandToBandDto(band: Band | BandWithAlbumCount): BandDto {
    return {
      id: band.BandId,
      name: band.Name,
      genre: band.Genre ?? undefined,
      country: band.Country ?? undefined,
      metalArchiveUrl: band.MetalArchiveUrl,
      albumCount: '_count' in band ? band._count.Album : undefined,
    };
  }

  async saveBand(band: BandDto): Promise<void> {
    await this.dbService.updateBand({ where: { BandId: band.id }, data: this.mapBandDtoToBand(band) });
  }

  async createBand(name: string): Promise<BandDto> {
    const band = await this.dbService.createBand({ Name: name });
    return this.mapBandToBandDto(band);
  }

  private mapBandDtoToBand(bandDto: BandDto): Partial<Band> {
    return {
      Name: bandDto.name,
      Genre: bandDto.genre,
      Country: bandDto.country,
      MetalArchiveUrl: bandDto.metalArchiveUrl,
    };
  }

  async deleteIfOrphaned(id: number): Promise<boolean> {
    const count = await this.dbService.bandAlbumCount(id);
    if (count === 0) {
      await this.dbService.deleteBand(id);
      return true;
    }
    return false;
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.metalArchivesService.getBandProps(url);
  }
}
