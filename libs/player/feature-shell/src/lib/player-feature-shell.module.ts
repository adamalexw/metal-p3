import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CoverUiModule } from '@metal-p3/cover/ui';
import { PlayerDataAccessModule } from '@metal-p3/player/data-access';
import { PlayerUiModule } from '@metal-p3/player/ui';
import { SafePipeModule } from 'safe-pipe';
import { PlayerShellComponent } from './player-shell/player-shell.component';

@NgModule({
  imports: [CommonModule, PlayerDataAccessModule, PlayerUiModule, CoverUiModule, SafePipeModule, MatToolbarModule, MatIconModule],
  declarations: [PlayerShellComponent],
  exports: [PlayerShellComponent],
})
export class PlayerFeatureShellModule {}
