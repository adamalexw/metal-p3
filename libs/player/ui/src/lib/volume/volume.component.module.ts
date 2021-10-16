import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { VolumeComponent } from './volume.component';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatSliderModule, MatIconModule],
  declarations: [VolumeComponent],
  exports: [VolumeComponent],
})
export class VolumeComponentModule {}
