import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
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
import { SharedNavigationModule } from '@metal-p3/shared/navigation';
import { TrackUiModule } from '@metal-p3/track/ui';
import { SafePipeModule } from 'safe-pipe';
import { AlbumHeaderComponent } from './album-header/album-header.component';
import { AlbumToolbarComponent } from './album-toolbar/album-toolbar.component';
import { AlbumComponent } from './album/album.component';
import { ListItemComponent } from './list-item/list-item.component';
import { ListToolbarComponent } from './list-toolbar/list-toolbar.component';

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
  MatBadgeModule,
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SafePipeModule,
    materialModules,
    CoverUiModule,
    TrackUiModule,
    PlayerDataAccessModule,
    SharedFeedbackModule,
    SharedNavigationModule,
  ],
  declarations: [ListItemComponent, AlbumComponent, AlbumToolbarComponent, ListToolbarComponent, AlbumHeaderComponent],
  exports: [ListItemComponent, ListToolbarComponent, AlbumComponent],
})
export class AlbumUiModule {}
