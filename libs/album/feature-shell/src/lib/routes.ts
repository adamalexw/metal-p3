import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MaintenanceEffects, maintenanceFeature } from '@metal-p3/maintenance/data-access';
import { selectAlbum } from '@metal-p3/shared/data-access';
import { provideEffects } from '@ngrx/effects';
import { Store, provideState } from '@ngrx/store';
import { map } from 'rxjs';
import { AlbumShellComponent } from './album/album.component';

export const routes: Routes = [
  {
    path: 'album/:id',
    component: AlbumShellComponent,
    canActivate: [() => inject(Store).select(selectAlbum).pipe(map(Boolean))],
  },
  {
    path: 'maintenance',
    loadChildren: () => import('@metal-p3/maintenance').then((m) => m.MAINTENANCE_ROUTES),
    providers: [provideState(maintenanceFeature), provideEffects(MaintenanceEffects)],
  },
];
