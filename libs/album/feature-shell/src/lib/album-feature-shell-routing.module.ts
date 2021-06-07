import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumShellComponent } from './album/album.component';
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
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AlbumFeatureShellRoutingModule {}
