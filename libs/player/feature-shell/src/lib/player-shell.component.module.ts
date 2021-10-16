import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CoverComponentModule } from '@metal-p3/cover/ui';
import { PlayerDataAccessModule } from '@metal-p3/player/data-access';
import { PlayerControlsComponentModule } from '@metal-p3/player/ui';
import { PlaylistShellModule } from '@metal-p3/playlist';
import { PlaylistComponentModule } from '@metal-p3/playlist/ui';
import { PlayerShellComponent } from './player-shell.component';

@NgModule({
  imports: [CommonModule, PlayerDataAccessModule, CoverComponentModule, PlayerControlsComponentModule, PlaylistShellModule, PlaylistComponentModule],
  declarations: [PlayerShellComponent],
  exports: [PlayerShellComponent],
})
export class PlayerFeatureShellModule {}
