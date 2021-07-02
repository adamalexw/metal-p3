import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaintenanceDataAccessModule } from '@metal-p3/maintenance/data-access';
import { MaintenanceUiModule } from '@metal-p3/maintenance/ui';
import { ApplyLyricsShellComponent } from './apply-lyrics/apply-lyrics.component';
import { LyricsHistoryShellComponent } from './lyrics-history/lyrics-history.component';
import { MaintenanceFeatureShellRoutingModule } from './maintenance-feature-shell-routing.module';

@NgModule({
  imports: [CommonModule, RouterModule, MaintenanceFeatureShellRoutingModule, MaintenanceDataAccessModule, MaintenanceUiModule],
  declarations: [LyricsHistoryShellComponent, ApplyLyricsShellComponent],
})
export class MaintenanceFeatureShellModule {}
