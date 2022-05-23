import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AlbumFeatureShellModule } from '@metal-p3/album';
import { API, BASE_PATH } from '@metal-p3/album/domain';
import { SharedDataAccessModule } from '@metal-p3/shared/data-access';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';

const config: SocketIoConfig = { url: environment.wsUrl, options: { transports: ['websocket'] } };

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    SharedDataAccessModule,
    StoreDevtoolsModule.instrument({
      maxAge: 100,
      logOnly: !environment.production,
      features: {
        pause: false,
        lock: true,
        persist: true,
      },
    }),
    AlbumFeatureShellModule,
    SocketIoModule.forRoot(config),
  ],
  providers: [
    { provide: API, useValue: environment.api },
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: ErrorHandler, useClass: ErrorsHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
