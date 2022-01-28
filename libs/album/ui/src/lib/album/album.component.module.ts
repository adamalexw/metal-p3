import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { CoverComponentModule } from '@metal-p3/cover/ui';
import { NotificationModule } from '@metal-p3/shared/feedback';
import { TracksComponentModule, TracksToolbarComponentModule } from '@metal-p3/track/ui';
import { AlbumFormComponentModule } from '../album-form/album-form.component.module';
import { AlbumToolbarComponentModule } from '../album-toolbar/album-toolbar.component.module';
import { AlbumComponent } from './album.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AlbumFormComponentModule,
    AlbumDataAccessModule,
    AlbumToolbarComponentModule,
    CoverComponentModule,
    TracksToolbarComponentModule,
    TracksComponentModule,
    NotificationModule,
    MatProgressBarModule,
    MatListModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
  ],
  declarations: [AlbumComponent],
  exports: [AlbumComponent],
})
export class AlbumComponentModule {}
