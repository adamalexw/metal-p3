import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumShellComponent } from './album/album.component';
import { HomeComponent } from './home/home.component';
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
    path: 'player',
    loadChildren: () => import('@metal-p3/player/feature-shell').then((m) => m.PlayerFeatureShellModule),
  },
  {
    path: '',
    component: HomeComponent,
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AlbumFeatureShellRoutingModule {}
