import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AlbumsUiModule } from '@metal-p3/album/ui';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';
import { AlbumFeatureShellRoutingModule } from './album-feature-shell-routing.module';
import { AlbumShellComponent } from './album/album.component';
import { HomeComponent } from './home/home.component';
import { AddAlbumDirective } from './list/add-album.directive';
import { ListComponent } from './list/list.component';
import { LyricsShellComponent } from './lyrics/lyrics.component';

@NgModule({
  imports: [CommonModule, AlbumsUiModule, AlbumFeatureShellRoutingModule, MatSidenavModule, MatIconModule, MatProgressSpinnerModule, SharedFeedbackModule],
  declarations: [ListComponent, AlbumShellComponent, LyricsShellComponent, AddAlbumDirective, HomeComponent],
  exports: [ListComponent],
})
export class AlbumFeatureShellModule {}
