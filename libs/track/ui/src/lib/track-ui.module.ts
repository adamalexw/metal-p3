import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TrackUtilModule } from '@metal-p3/track/util';
import { LyricsComponent } from './lyrics/lyrics.component';
import { TracksToolbarComponent } from './tracks-toolbar/tracks-toolbar.component';
import { TracksComponent } from './tracks/tracks.component';

@NgModule({
  imports: [
    CommonModule,
    TrackUtilModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatToolbarModule,
    MatButtonModule,
    MatBottomSheetModule,
  ],
  declarations: [TracksComponent, TracksToolbarComponent, LyricsComponent],
  exports: [TracksComponent, TracksToolbarComponent],
})
export class TrackUiModule {}
