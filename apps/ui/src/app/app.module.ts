import { ErrorHandler, NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AlbumFeatureShellModule } from '@metal-p3/album';
import { BASE_PATH } from '@metal-p3/album/domain';
import { SharedDataAccessModule } from '@metal-p3/shared/data-access';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { environment } from '../environments/environment.prod';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, RouterModule, SharedDataAccessModule, AlbumFeatureShellModule, MatSidenavModule],
  providers: [
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: ErrorHandler, useClass: ErrorsHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
