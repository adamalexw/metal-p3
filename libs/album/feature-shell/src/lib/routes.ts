import { Routes } from '@angular/router';
import { AlbumShellComponent } from './album/album.component';

export const routes: Routes = [
  {
    path: 'album/:id',
    component: AlbumShellComponent,
  },
  {
    path: 'maintenance',
    loadChildren: () => import('@metal-p3/maintenance').then((m) => m.MAINTENANCE_ROUTES),
  },
];
