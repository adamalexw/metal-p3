import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SharedUtilsModule } from '@metal-p3/shared/utils';
import { SafePipeModule } from 'safe-pipe';
import { AlbumToolbarComponent } from './album-toolbar/album-toolbar.component';
import { AlbumComponent } from './album/album.component';
import { CoverDragDirective } from './cover/cover-dnd.directive';
import { CoverComponent } from './cover/cover.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ListToolbarComponent } from './list-toolbar/list-toolbar.component';
import { LyricsToolbarComponent } from './lyrics-toolbar/lyrics-toolbar.component';
import { LyricsComponent } from './lyrics/lyrics.component';
import { TracksComponent } from './tracks/tracks.component';

const materialModules = [MatCheckboxModule, MatProgressSpinnerModule, MatToolbarModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatSelectModule, CdkTableModule, MatListModule];

@NgModule({
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, SafePipeModule, materialModules, SharedUtilsModule],
  declarations: [ListItemComponent, AlbumComponent, CoverComponent, CoverDragDirective, AlbumToolbarComponent, TracksComponent, LyricsComponent, LyricsToolbarComponent, ListToolbarComponent],
  exports: [ListItemComponent, ListToolbarComponent, AlbumComponent, LyricsComponent],
})
export class AlbumsUiModule {}
