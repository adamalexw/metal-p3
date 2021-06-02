import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BitRatePipe } from './bitrate.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [BitRatePipe],
  exports: [BitRatePipe],
})
export class TrackUtilModule {}
