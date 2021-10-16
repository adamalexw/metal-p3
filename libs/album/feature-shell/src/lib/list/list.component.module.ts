import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ListItemComponentModule, ListToolbarComponentModule } from '@metal-p3/album/ui';
import { PlayerFeatureShellModule } from '@metal-p3/player';
import { AddAlbumDirective } from './add-album.directive';
import { ListComponent } from './list.component';

@NgModule({
  imports: [CommonModule, ScrollingModule, ListToolbarComponentModule, ListItemComponentModule, PlayerFeatureShellModule],
  declarations: [ListComponent, AddAlbumDirective],
  exports: [ListComponent],
})
export class ListComponentModule {}
