import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CoverUiModule } from '@metal-p3/cover/ui';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';
import { TrackUtilModule } from '@metal-p3/track/util';
import { PlaylistToolbarComponent } from './playlist-toolbar/playlist-toolbar.component';
import { PlaylistComponent } from './playlist/playlist.component';

const materialModules = [DragDropModule, MatTableModule, MatIconModule, MatSliderModule, MatButtonModule, MatToolbarModule, MatMenuModule, MatInputModule];

@NgModule({
  imports: [CommonModule, FormsModule, CoverUiModule, TrackUtilModule, SharedFeedbackModule, materialModules],
  declarations: [PlaylistComponent, PlaylistToolbarComponent],
  exports: [PlaylistComponent, PlaylistToolbarComponent],
})
export class PlaylistUiModule {}
