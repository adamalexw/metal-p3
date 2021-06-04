import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CoverUiModule } from '@metal-p3/cover/ui';
import { PlayerDataAccessModule } from '@metal-p3/player/data-access';
import { PlayerUiModule } from '@metal-p3/player/ui';
import { PlayerFeatureShellRoutingModule } from './player-feature-shell-routing.module';
import { PlayerShellComponent } from './player-shell/player-shell.component';

@NgModule({
  imports: [CommonModule, PlayerFeatureShellRoutingModule, PlayerDataAccessModule, PlayerUiModule, CoverUiModule, MatToolbarModule],
  declarations: [PlayerShellComponent],
})
export class PlayerFeatureShellModule {}
