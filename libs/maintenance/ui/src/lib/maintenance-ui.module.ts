import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CoverUiModule } from '@metal-p3/cover/ui';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';
import { SharedNavigationModule } from '@metal-p3/shared/navigation';
import { ApplyLyricsToolbarComponent } from './apply-lyrics-toolbar/apply-lyrics-toolbar.component';
import { ApplyLyricsComponent } from './apply-lyrics/apply-lyrics.component';
import { ExtraFilesComponent } from './extra-files/extra-files.component';
import { LyricsHistoryToolbarComponent } from './lyrics-history-toolbar/lyrics-history-toolbar.component';
import { LyricsHistoryComponent } from './lyrics-history/lyrics-history.component';
import { UnmappedFoldersComponent } from './unmapped-folders/unmapped-folders.component';

const materialModules = [
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatTableModule,
  MatSelectModule,
  MatMenuModule,
  MatProgressBarModule,
  MatCheckboxModule,
  MatDialogModule,
  MatSortModule,
  MatTooltipModule,
  MatListModule,
];

@NgModule({
  imports: [CommonModule, RouterModule, SharedFeedbackModule, SharedNavigationModule, CoverUiModule, materialModules],
  declarations: [LyricsHistoryToolbarComponent, LyricsHistoryComponent, ApplyLyricsToolbarComponent, ApplyLyricsComponent, UnmappedFoldersComponent, ExtraFilesComponent],
  exports: [LyricsHistoryToolbarComponent, LyricsHistoryComponent, ApplyLyricsToolbarComponent, ApplyLyricsComponent, UnmappedFoldersComponent, ExtraFilesComponent],
})
export class MaintenanceUiModule {}
