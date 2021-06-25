import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TrackUtilModule } from '@metal-p3/track/util';
import { PlayerControlsComponent } from './player-controls/player-controls.component';
import { PlaylistComponent } from './playlist/playlist.component';

const materialModules = [
  DragDropModule,
  MatTableModule, MatIconModule, MatSliderModule, MatButtonModule, MatToolbarModule
]

@NgModule({
  imports: [CommonModule, TrackUtilModule, materialModules],
  declarations: [PlaylistComponent, PlayerControlsComponent],
  exports: [PlaylistComponent, PlayerControlsComponent],
})
export class PlayerUiModule {}
