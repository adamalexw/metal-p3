import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'album/:id',
    loadComponent: () => import('./album/album.component').then((m) => m.AlbumShellComponent),
  },
  {
    path: 'maintenance',
    loadChildren: () => import('@metal-p3/maintenance').then((m) => m.MAINTENANCE_ROUTES),
  },
  {
    path: 'setlist-importer',
    loadChildren: () => import('@metal-p3/setlist-importer').then((m) => m.SETLIST_IMPORTER_ROUTES),
  },
];
