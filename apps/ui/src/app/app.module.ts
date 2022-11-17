import { ErrorHandler, NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HomeComponent, routes } from '@metal-p3/album';
import { API, BASE_PATH, TAKE } from '@metal-p3/album/domain';
import { SharedDataAccessModule } from '@metal-p3/shared/data-access';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { SharedNgrxStoreModule } from '@metal-p3/shared/ngrx-store';
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
    RouterModule.forRoot(routes, { enableTracing: false }),
    SharedNgrxStoreModule,
    SharedDataAccessModule,
    !environment.production
      ? StoreDevtoolsModule.instrument({
          maxAge: 100,
          logOnly: environment.production,
        })
      : [],
    HomeComponent,
    MatSnackBarModule,
    SocketIoModule.forRoot(config),
  ],
  providers: [
    { provide: API, useValue: environment.api },
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: TAKE, useValue: environment.take },
    { provide: ErrorHandler, useClass: ErrorsHandler },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
