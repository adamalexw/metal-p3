import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AlbumsUiModule } from '@metal-p3/albums/ui';
import { AlbumShellComponent } from './album/album.component';
import { AlbumsFeatureShellRoutingModule } from './albums-feature-shell-routing.module';
import { HomeComponent } from './home/home.component';
import { AddAlbumDirective } from './list/add-album.directive';
import { ListComponent } from './list/list.component';
import { LyricsShellComponent } from './lyrics/lyrics.component';

@NgModule({
  imports: [CommonModule, AlbumsUiModule, AlbumsFeatureShellRoutingModule, MatSidenavModule, MatIconModule, MatProgressSpinnerModule],
  declarations: [ListComponent, AlbumShellComponent, LyricsShellComponent, AddAlbumDirective, HomeComponent],
  exports: [ListComponent],
})
export class AlbumsFeatureShellModule {}
