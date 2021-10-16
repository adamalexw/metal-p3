import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimePipeModule } from '@metal-p3/track/util';
import { VolumeComponentModule } from '../volume/volume.component.module';
import { PlayerControlsComponent } from './player-controls.component';

@NgModule({
  imports: [CommonModule, VolumeComponentModule, TimePipeModule, MatToolbarModule, MatSliderModule, MatIconModule],
  declarations: [PlayerControlsComponent],
  exports: [PlayerControlsComponent],
})
export class PlayerControlsComponentModule {}
