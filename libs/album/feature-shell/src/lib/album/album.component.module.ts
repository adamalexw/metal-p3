import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { AlbumComponentModule } from '@metal-p3/album/ui';
import { CoverDataAccessModule } from '@metal-p3/cover/data-access';
import { MaintenanceDataAccessModule } from '@metal-p3/maintenance/data-access';
import { PlayerDataAccessModule } from '@metal-p3/player/data-access';
import { SharedDataAccessModule } from '@metal-p3/shared/data-access';
import { NotificationModule } from '@metal-p3/shared/feedback';
import { AlbumShellComponent } from './album.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AlbumDataAccessModule,
    AlbumComponentModule,
    SharedDataAccessModule,
    PlayerDataAccessModule,
    CoverDataAccessModule,
    MaintenanceDataAccessModule,
    NotificationModule,
  ],
  declarations: [AlbumShellComponent],
  exports: [AlbumShellComponent],
})
export class AlbumShellComponentModule {}
