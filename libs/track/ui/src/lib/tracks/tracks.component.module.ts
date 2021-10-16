import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDeleteComponentModule } from '@metal-p3/shared/feedback';
import { BitRatePipeModule, TimePipeModule } from '@metal-p3/track/util';
import { LyricsComponentModule } from '../lyrics/lyrics.component.module';
import { TracksComponent } from './tracks.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BitRatePipeModule,
    TimePipeModule,
    LyricsComponentModule,
    ConfirmDeleteComponentModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBottomSheetModule,
  ],
  declarations: [TracksComponent],
  exports: [TracksComponent],
})
export class TracksComponentModule {}
