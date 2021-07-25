import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TrackUtilModule } from '@metal-p3/track/util';
import { PlayerControlsComponent } from './player-controls/player-controls.component';

const materialModules = [MatIconModule, MatSliderModule, MatButtonModule, MatToolbarModule];

@NgModule({
  imports: [CommonModule, TrackUtilModule, materialModules],
  declarations: [PlayerControlsComponent],
  exports: [PlayerControlsComponent],
})
export class PlayerUiModule {}
