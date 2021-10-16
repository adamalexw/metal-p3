import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDeleteComponentModule } from '@metal-p3/shared/feedback';
import { LyricsHistoryComponent } from './lyrics-history.component';

@NgModule({
  imports: [CommonModule, ConfirmDeleteComponentModule, MatTableModule, MatIconModule, MatCheckboxModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  declarations: [LyricsHistoryComponent],
  exports: [LyricsHistoryComponent],
})
export class LyricsHistoryComponentModule {}
