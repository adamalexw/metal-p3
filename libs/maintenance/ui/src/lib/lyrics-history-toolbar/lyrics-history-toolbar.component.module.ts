import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SharedNavToolbarModule } from '@metal-p3/shared/navigation';
import { LyricsHistoryToolbarComponent } from './lyrics-history-toolbar.component';

@NgModule({
  imports: [CommonModule, SharedNavToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatProgressBarModule],
  declarations: [LyricsHistoryToolbarComponent],
  exports: [LyricsHistoryToolbarComponent],
})
export class LyricsHistoryToolbarComponentModule {}
