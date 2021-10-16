import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { LyricsHistoryComponentModule, LyricsHistoryToolbarComponentModule } from '@metal-p3/maintenance/ui';
import { LyricsHistoryShellComponent } from './lyrics-history.component';

@NgModule({
  imports: [
    CommonModule,
    LyricsHistoryToolbarComponentModule,
    LyricsHistoryComponentModule,
    ScrollingModule,
    MatDialogModule,
    RouterModule.forChild([
      {
        path: '',
        component: LyricsHistoryShellComponent,
      },
    ]),
  ],
  declarations: [LyricsHistoryShellComponent],
  exports: [LyricsHistoryShellComponent],
})
export class LyricsHistoryShellComponentModule {}
