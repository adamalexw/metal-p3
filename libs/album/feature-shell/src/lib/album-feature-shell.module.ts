import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AlbumsDataAccessModule } from '@metal-p3/album/data-access';
import { AlbumsUiModule } from '@metal-p3/album/ui';
import { PlayerFeatureShellModule } from '@metal-p3/player/feature-shell';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';
import { AlbumFeatureShellRoutingModule } from './album-feature-shell-routing.module';
import { AlbumShellComponent } from './album/album.component';
import { HomeComponent } from './home/home.component';
import { AddAlbumDirective } from './list/add-album.directive';
import { ListComponent } from './list/list.component';
import { LyricsShellComponent } from './lyrics/lyrics.component';

@NgModule({
  imports: [
    CommonModule,
    AlbumsDataAccessModule,
    AlbumsUiModule,
    AlbumFeatureShellRoutingModule,
    PlayerFeatureShellModule,
    MatSidenavModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedFeedbackModule,
    ScrollingModule,
  ],
  declarations: [ListComponent, AlbumShellComponent, LyricsShellComponent, AddAlbumDirective, HomeComponent],
  exports: [HomeComponent],
})
export class AlbumFeatureShellModule {}
