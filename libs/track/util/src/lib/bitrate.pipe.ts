import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ standalone: true, name: 'bitrate' })
export class BitRatePipe implements PipeTransform {
  transform(bitrate: number, file?: string): number | string {
    if (file?.toLowerCase().endsWith('.flac') || bitrate > 320_000) {
      return 'FLAC';
    }

    return Math.round(bitrate / 1000);
  }
}
