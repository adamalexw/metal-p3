import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PlaylistDataAccessModule } from '@metal-p3/playlist/data-access';
import { PlaylistToolbarComponentModule } from '@metal-p3/playlist/ui';
import { PlaylistShellComponent } from './playlist-shell.component';

@NgModule({
  imports: [CommonModule, PlaylistDataAccessModule, PlaylistToolbarComponentModule],
  declarations: [PlaylistShellComponent],
  exports: [PlaylistShellComponent],
})
export class PlaylistShellModule {}
