import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlbumsDataAccessModule } from '@metal-p3/albums/data-access';
import { AlbumsUiModule } from '@metal-p3/albums/ui';
import { AlbumShellComponent } from './album/album.component';
import { AlbumsFeatureShellRoutingModule } from './albums-feature-shell-routing.module';
import { AddAlbumDirective } from './list/add-album.directive';
import { ListComponent } from './list/list.component';
import { LyricsShellComponent } from './lyrics/lyrics.component';

@NgModule({
  imports: [CommonModule, AlbumsDataAccessModule, AlbumsUiModule, AlbumsFeatureShellRoutingModule, MatProgressSpinnerModule],
  declarations: [ListComponent, AlbumShellComponent, LyricsShellComponent, AddAlbumDirective],
  exports: [ListComponent],
})
export class AlbumsFeatureShellModule {}
