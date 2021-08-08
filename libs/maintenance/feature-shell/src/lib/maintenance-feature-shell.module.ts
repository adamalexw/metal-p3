import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaintenanceDataAccessModule } from '@metal-p3/maintenance/data-access';
import { MaintenanceUiModule } from '@metal-p3/maintenance/ui';
import { ApplyLyricsShellComponent } from './apply-lyrics/apply-lyrics.component';
import { ExtraFilesShellComponent } from './extra-files/extra-files.component';
import { LyricsHistoryShellComponent } from './lyrics-history/lyrics-history.component';
import { MaintenanceFeatureShellRoutingModule } from './maintenance-feature-shell-routing.module';
import { UnmappedFoldersShellComponent } from './unmapped-folders/unmapped-folders.component';
import { UrlShellComponent } from './url/url.component';

@NgModule({
  imports: [CommonModule, RouterModule, MaintenanceFeatureShellRoutingModule, MaintenanceDataAccessModule, MaintenanceUiModule],
  declarations: [LyricsHistoryShellComponent, ApplyLyricsShellComponent, UnmappedFoldersShellComponent, ExtraFilesShellComponent, UrlShellComponent],
})
export class MaintenanceFeatureShellModule {}
