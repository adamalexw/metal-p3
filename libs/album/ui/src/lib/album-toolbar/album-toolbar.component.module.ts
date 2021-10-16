import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDeleteComponentModule } from '@metal-p3/shared/feedback';
import { SharedNavToolbarModule } from '@metal-p3/shared/navigation';
import { AlbumHeaderComponentModule } from '../album-header/album-header.component.module';
import { AlbumToolbarComponent } from './album-toolbar.component';

@NgModule({
  imports: [CommonModule, SharedNavToolbarModule, AlbumHeaderComponentModule, ConfirmDeleteComponentModule, MatIconModule, MatButtonModule, MatBadgeModule],
  declarations: [AlbumToolbarComponent],
  exports: [AlbumToolbarComponent],
})
export class AlbumToolbarComponentModule {}
