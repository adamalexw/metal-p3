import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BitRatePipe } from './bitrate.pipe';
import { TimePipe } from './time.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [BitRatePipe, TimePipe],
  exports: [BitRatePipe, TimePipe],
})
export class TrackUtilModule {}
