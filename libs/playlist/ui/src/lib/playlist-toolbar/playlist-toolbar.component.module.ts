import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ConfirmDeleteComponentModule } from '@metal-p3/shared/feedback';
import { TimePipeModule } from '@metal-p3/track/util';
import { PlaylistToolbarComponent } from './playlist-toolbar.component';

@NgModule({
  imports: [CommonModule, FormsModule, TimePipeModule, ConfirmDeleteComponentModule, MatToolbarModule, MatMenuModule, MatButtonModule, MatIconModule, MatInputModule],
  declarations: [PlaylistToolbarComponent],
  exports: [PlaylistToolbarComponent],
})
export class PlaylistToolbarComponentModule {}
