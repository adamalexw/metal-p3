import { provideHttpClient, withXhr } from '@angular/common/http';
import { ErrorHandler, enableProdMode, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling, withComponentInputBinding } from '@angular/router';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { routes } from '@metal-p3/album';
import { ALBUM_DRAWER_WIDTH, API, BASE_PATH, TAKE } from '@metal-p3/album/domain';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const config: SocketIoConfig = { url: environment.wsUrl, options: { transports: ['websocket'] } };

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }), withComponentInputBinding()),
    provideHttpClient(withXhr()),
    provideZonelessChangeDetection(),
    importProvidersFrom(MatSnackBarModule, SocketIoModule.forRoot(config)),
    { provide: API, useValue: 'http://' + window.location.hostname + ':3333/api/' },
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: TAKE, useValue: environment.take },
    { provide: ALBUM_DRAWER_WIDTH, useValue: 1130 },
    { provide: ErrorHandler, useClass: ErrorsHandler },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', subscriptSizing: 'dynamic' } },
  ],
}).catch((err) => console.error(err));
