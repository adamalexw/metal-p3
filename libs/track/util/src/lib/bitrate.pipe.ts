import { CommonModule } from '@angular/common';
import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'bitrate' })
export class BitRatePipe implements PipeTransform {
  transform(bitrate: number): number {
    return bitrate / 1000;
  }
}

@NgModule({
  imports: [CommonModule],
  declarations: [BitRatePipe],
  exports: [BitRatePipe],
})
export class BitRatePipeModule {}
