import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlayerControlsComponent } from './player-controls/player-controls.component';
import { PlaylistComponent } from './playlist/playlist.component';

@NgModule({
  imports: [CommonModule, MatTableModule, MatIconModule, MatSliderModule, MatToolbarModule],
  declarations: [PlaylistComponent, PlayerControlsComponent],
  exports: [PlaylistComponent, PlayerControlsComponent],
})
export class PlayerUiModule {}
