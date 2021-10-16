import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CoverComponentModule } from '@metal-p3/cover/ui';
import { TimePipeModule } from '@metal-p3/track/util';
import { PlaylistComponent } from './playlist.component';

@NgModule({
  imports: [CommonModule, CoverComponentModule, TimePipeModule, CdkTableModule, DragDropModule, MatTableModule, MatIconModule],
  declarations: [PlaylistComponent],
  exports: [PlaylistComponent],
})
export class PlaylistComponentModule {}
