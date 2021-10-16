import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumShellComponent } from './album/album.component';
import { AlbumShellComponentModule } from './album/album.component.module';

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
  imports: [AlbumShellComponentModule, RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AlbumFeatureShellRoutingModule {}
