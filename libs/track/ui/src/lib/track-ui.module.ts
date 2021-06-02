import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TrackUtilModule } from '@metal-p3/track/util';
import { TracksComponent } from './tracks/tracks.component';

@NgModule({
  imports: [CommonModule, TrackUtilModule, FormsModule, ReactiveFormsModule, MatTableModule, MatProgressSpinnerModule, MatProgressSpinnerModule, MatIconModule, MatInputModule, MatMenuModule],
  declarations: [TracksComponent],
  exports: [TracksComponent],
})
export class TrackUiModule {}
