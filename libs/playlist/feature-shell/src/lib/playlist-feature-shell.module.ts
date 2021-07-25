import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PlaylistDataAccessModule } from '@metal-p3/playlist/data-access';
import { PlaylistUiModule } from '@metal-p3/playlist/ui';
import { PlaylistShellComponent } from './playlist-shell/playlist-shell.component';

@NgModule({
  imports: [CommonModule, PlaylistDataAccessModule, PlaylistUiModule],
  declarations: [PlaylistShellComponent],
  exports: [PlaylistShellComponent],
})
export class PlaylistFeatureShellModule {}
