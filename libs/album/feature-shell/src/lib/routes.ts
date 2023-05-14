import { Routes } from '@angular/router';
import { MaintenanceEffects, maintenanceFeature } from '@metal-p3/maintenance/data-access';
import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';
import { AlbumShellComponent } from './album/album.component';

export const routes: Routes = [
  {
    path: 'album/:id',
    component: AlbumShellComponent,
  },
  {
    path: 'maintenance',
    loadChildren: () => import('@metal-p3/maintenance').then((m) => m.MAINTENANCE_ROUTES),
    providers: [provideState(maintenanceFeature), provideEffects(MaintenanceEffects)],
  },
];
