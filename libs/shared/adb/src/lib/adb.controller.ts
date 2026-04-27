import { Device } from '@devicefarmer/adbkit';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { AdbService } from './adb.service';

@Controller('adb')
export class AdbController {
  constructor(private readonly adbService: AdbService) {}

  @Post('pair')
  pair(@Body() address: { host: string; port: number; code: string }): Observable<string> {
    return from(this.adbService.pairDevice(address.host, address.port, address.code));
  }

  @Post('connect')
  connect(@Body() address: { host: string; port: number }): Observable<string> {
    return from(this.adbService.connectPhone(address.host, address.port));
  }

  @Get('devices')
  devices(): Observable<Device[]> {
    return from(this.adbService.getDevices());
  }

  @Get('wifi')
  isWifiConnected(): { connected: boolean } {
    return { connected: this.adbService.isWifiConnected() };
  }
}
