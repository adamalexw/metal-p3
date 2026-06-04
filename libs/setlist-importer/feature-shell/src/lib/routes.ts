import { Routes } from '@angular/router';
import { SetlistImporterEffects, setlistImporterFeature } from '@metal-p3/setlist-importer/data-access';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';

export const SETLIST_IMPORTER_ROUTES: Routes = [
  {
    path: '',
    providers: [provideState(setlistImporterFeature), provideEffects(SetlistImporterEffects)],
    loadComponent: () => import('./setlist-importer-shell.component').then((m) => m.SetlistImporterShellComponent),
  },
];
