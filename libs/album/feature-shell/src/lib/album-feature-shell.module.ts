import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { AlbumUiModule } from '@metal-p3/album/ui';
import { MaintenanceDataAccessModule } from '@metal-p3/maintenance/data-access';
import { PlayerFeatureShellModule } from '@metal-p3/player';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';
import { AlbumFeatureShellRoutingModule } from './album-feature-shell-routing.module';
import { AlbumShellComponent } from './album/album.component';
import { HomeComponent } from './home/home.component';
import { AddAlbumDirective } from './list/add-album.directive';
import { ListComponent } from './list/list.component';

@NgModule({
  imports: [
    CommonModule,
    AlbumDataAccessModule,
    AlbumUiModule,
    AlbumFeatureShellRoutingModule,
    PlayerFeatureShellModule,
    MatSidenavModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedFeedbackModule,
    ScrollingModule,
    MaintenanceDataAccessModule,
  ],
  declarations: [ListComponent, AlbumShellComponent, AddAlbumDirective, HomeComponent],
  exports: [HomeComponent],
})
export class AlbumFeatureShellModule {}
