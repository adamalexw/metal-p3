import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumShellComponent } from './album/album.component';
import { ListComponent } from './list/list.component';
import { LyricsShellComponent } from './lyrics/lyrics.component';

const routes: Routes = [
  {
    path: 'album/:id',
    component: AlbumShellComponent,
  },
  {
    path: 'album/lyrics/:id',
    component: LyricsShellComponent,
  },
  {
    path: '',
    component: ListComponent,
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AlbumsFeatureShellRoutingModule {}
