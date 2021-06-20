import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CoverUiModule } from '@metal-p3/cover/ui';
import { PlayerDataAccessModule } from '@metal-p3/player/data-access';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';
import { TrackUiModule } from '@metal-p3/track/ui';
import { SafePipeModule } from 'safe-pipe';
import { AlbumHeaderComponent } from './album-header/album-header.component';
import { AlbumToolbarComponent } from './album-toolbar/album-toolbar.component';
import { AlbumComponent } from './album/album.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ListToolbarComponent } from './list-toolbar/list-toolbar.component';
import { LyricsToolbarComponent } from './lyrics-toolbar/lyrics-toolbar.component';
import { LyricsComponent } from './lyrics/lyrics.component';

const materialModules = [
  MatCardModule,
  MatCheckboxModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatTableModule,
  MatSelectModule,
  CdkTableModule,
  MatListModule,
  MatMenuModule,
  MatProgressBarModule,
];

@NgModule({
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SafePipeModule, materialModules, CoverUiModule, TrackUiModule, PlayerDataAccessModule, SharedFeedbackModule],
  declarations: [ListItemComponent, AlbumComponent, AlbumToolbarComponent, LyricsComponent, LyricsToolbarComponent, ListToolbarComponent, AlbumHeaderComponent],
  exports: [ListItemComponent, ListToolbarComponent, AlbumComponent, LyricsComponent],
})
export class AlbumUiModule {}
