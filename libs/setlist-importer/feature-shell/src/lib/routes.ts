import { Routes } from '@angular/router';

export const SETLIST_IMPORTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./setlist-importer-shell.component').then((m) => m.SetlistImporterShellComponent),
  },
];
