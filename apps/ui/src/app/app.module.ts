import { ErrorHandler, NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AlbumFeatureShellModule } from '@metal-p3/album';
import { API, BASE_PATH } from '@metal-p3/album/domain';
import { SharedDataAccessModule } from '@metal-p3/shared/data-access';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

const config: SocketIoConfig = { url: environment.wsUrl, options: { transports: ['websocket'] } };

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, BrowserAnimationsModule, RouterModule, SharedDataAccessModule, AlbumFeatureShellModule, MatSidenavModule, SocketIoModule.forRoot(config)],
  providers: [
    { provide: API, useValue: environment.api },
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: ErrorHandler, useClass: ErrorsHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
