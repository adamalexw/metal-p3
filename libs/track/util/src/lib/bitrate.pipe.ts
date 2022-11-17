import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ standalone: true, name: 'bitrate' })
export class BitRatePipe implements PipeTransform {
  transform(bitrate: number): number {
    return bitrate / 1000;
  }
}
