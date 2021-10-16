import { NgModule } from '@angular/core';
import { AlbumFeatureShellRoutingModule } from './album-feature-shell-routing.module';
import { HomeComponent } from './home/home.component';
import { HomeComponentModule } from './home/home.component.module';

@NgModule({
  imports: [AlbumFeatureShellRoutingModule, HomeComponentModule],
  exports: [HomeComponent],
})
export class AlbumFeatureShellModule {}
