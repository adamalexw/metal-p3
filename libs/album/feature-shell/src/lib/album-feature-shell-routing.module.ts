import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumShellComponent } from './album/album.component';

const routes: Routes = [
  {
    path: 'album/:id',
    component: AlbumShellComponent,
  },
  {
    path: 'maintenance',
    loadChildren: () => import('@metal-p3/maintenance').then((m) => m.MaintenanceFeatureShellModule),
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AlbumFeatureShellRoutingModule {}
