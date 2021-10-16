import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { AlbumHeaderComponent } from './album-header.component';

@NgModule({
  imports: [CommonModule, AlbumDataAccessModule, RouterModule],
  declarations: [AlbumHeaderComponent],
  exports: [AlbumHeaderComponent],
})
export class AlbumHeaderComponentModule {}
