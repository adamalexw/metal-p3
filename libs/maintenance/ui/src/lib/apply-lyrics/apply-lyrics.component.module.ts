import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApplyLyricsToolbarComponentModule } from '../apply-lyrics-toolbar/apply-lyrics-toolbar.component.module';
import { ApplyLyricsComponent } from './apply-lyrics.component';

@NgModule({
  imports: [CommonModule, ApplyLyricsToolbarComponentModule, MatProgressBarModule, MatTableModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule],
  declarations: [ApplyLyricsComponent],
  exports: [ApplyLyricsComponent],
})
export class ApplyLyricsComponentModule {}
