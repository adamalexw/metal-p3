import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { BASE_PATH } from '@metal-p3/albums/data-access';
import { AlbumsFeatureShellModule } from '@metal-p3/albums/feature-shell';
import { environment } from '../environments/environment.prod';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, RouterModule, AlbumsFeatureShellModule],
  providers: [{ provide: BASE_PATH, useValue: environment.baseFolderLocation }],
  bootstrap: [AppComponent],
})
export class AppModule {}
