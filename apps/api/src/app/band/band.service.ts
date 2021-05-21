import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Injectable } from '@nestjs/common';
import { Band, Prisma } from '@prisma/client';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DbService } from '../shared/db.service';
import { MetalArchivesService } from '../shared/metal-archives.service';

@Injectable()
export class BandService {
  constructor(private readonly dbService: DbService, private readonly metalArchivesService: MetalArchivesService) {}

  getBands(request: { criteria?: string }): Observable<BandDto[]> {
    let where: Prisma.BandWhereInput;

    if (request.criteria) {
      where = {
        Name: { contains: request.criteria },
      };
    }

    return from(this.dbService.bands(where)).pipe(map((band) => band.map((album) => this.mapBandToBandDto(album))));
  }

  getBand(id: number): Observable<BandDto> {
    return from(this.dbService.band({ BandId: +id })).pipe(map((band) => this.mapBandToBandDto(band)));
  }

  private mapBandToBandDto(band: Band): BandDto {
    return {
      id: band.BandId,
      name: band.Name,
      genre: band.Genre,
      country: band.Country,
      metalArchiveUrl: band.MetalArchiveUrl,
    };
  }

  async saveBand(band: BandDto): Promise<void> {
    this.dbService.updateBand({ where: { BandId: band.id }, data: this.mapBandDtoToBand(band) });
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
