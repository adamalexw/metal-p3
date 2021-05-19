import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AlbumsFeatureShellModule } from '@metal-p3/albums/feature-shell';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, RouterModule, AlbumsFeatureShellModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
