import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { BandService } from './band.service';

@Controller('band')
export class BandController {
  constructor(private readonly bandService: BandService) {}

  @Get('search')
  bands(@Query('criteria') criteria?: string): Observable<BandDto[]> {
    return this.bandService.getBands({ criteria });
  }

  @Get()
  album(@Query('id') id: number): Observable<BandDto> {
    return this.bandService.getBand(id);
  }

  @Get('props')
  props(@Query('url') url: string): Observable<BandProps> {
    return this.bandService.getBandProps(url);
  }

  @Patch()
  @HttpCode(HttpStatus.ACCEPTED)
  patch(@Body() band: BandDto): void {
    this.bandService.saveBand(band);
  }
}
