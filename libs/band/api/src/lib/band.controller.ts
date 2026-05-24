import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { BandService } from './band.service';

@Controller('band')
export class BandController {
  constructor(private readonly bandService: BandService) {}

  @Get('search')
  bands(@Query('criteria') criteria?: string): Promise<BandDto[]> {
    return this.bandService.getBands({ criteria });
  }

  @Get()
  album(@Query('id') id: number): Promise<BandDto> {
    return this.bandService.getBand(id);
  }

  @Get('props')
  props(@Query('url') url: string): Observable<BandProps> {
    return this.bandService.getBandProps(url);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body('name') name: string): Promise<BandDto> {
    return this.bandService.createBand(name);
  }

  @Patch()
  @HttpCode(HttpStatus.ACCEPTED)
  patch(@Body() band: BandDto): Promise<void> {
    return this.bandService.saveBand(band);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteIfOrphaned(@Query('id') id: number): Promise<boolean> {
    return this.bandService.deleteIfOrphaned(+id);
  }
}
