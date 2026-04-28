import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Band, Prisma } from '@metal-p3/prisma/client';
import { DbService } from '@metal-p3/shared/database';
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

  private mapBandToBandDto(band: Band): BandDto {
    return {
      id: band.BandId,
      name: band.Name,
      genre: band.Genre ?? undefined,
      country: band.Country ?? undefined,
      metalArchiveUrl: band.MetalArchiveUrl,
    };
  }

  async saveBand(band: BandDto): Promise<void> {
    await this.dbService.updateBand({ where: { BandId: band.id }, data: this.mapBandDtoToBand(band) });
  }

  private mapBandDtoToBand(bandDto: BandDto): Partial<Band> {
    return {
      Name: bandDto.name,
      Genre: bandDto.genre,
      Country: bandDto.country,
      MetalArchiveUrl: bandDto.metalArchiveUrl,
    };
  }

  getBandProps(url: string): Observable<BandProps> {
    return this.metalArchivesService.getBandProps(url);
  }
}
