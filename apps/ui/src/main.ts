import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler, enableProdMode, importProvidersFrom, isDevMode } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from '@metal-p3/album';
import { API, BASE_PATH, TAKE } from '@metal-p3/album/domain';
import { PlayerEffects, playerFeature } from '@metal-p3/player/data-access';
import { PlaylistEffects, playlistFeature } from '@metal-p3/playlist/data-access';
import { AlbumEffects, BandEffects, CoverEffects, TrackEffects, albumsFeature } from '@metal-p3/shared/data-access';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const config: SocketIoConfig = { url: environment.wsUrl, options: { transports: ['websocket'] } };

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule, SocketIoModule.forRoot(config)),
    provideRouterStore(),
    provideStore({ router: routerReducer }),
    provideState(albumsFeature),
    provideState(playerFeature),
    provideState(playlistFeature),
    provideStoreDevtools({
      maxAge: 100,
      logOnly: !isDevMode(),
      autoPause: true,
      connectInZone: true,
    }),
    provideEffects([AlbumEffects, BandEffects, CoverEffects, TrackEffects, PlayerEffects, PlaylistEffects]),
    { provide: API, useValue: 'http://' + window.location.hostname + ':3333/api/' },
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: TAKE, useValue: environment.take },
    { provide: ErrorHandler, useClass: ErrorsHandler },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', subscriptSizing: 'dynamic' } },
  ],
}).catch((err) => console.error(err));
