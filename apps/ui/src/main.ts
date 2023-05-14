import { provideHttpClient } from '@angular/common/http';
import { ErrorHandler, enableProdMode, importProvidersFrom } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from '@metal-p3/album';
import { API, BASE_PATH, TAKE } from '@metal-p3/album/domain';
import { PlayerEffects, playerFeature } from '@metal-p3/player/data-access';
import { PlaylistEffects, playlistFeature } from '@metal-p3/playlist/data-access';
import { AlbumEffects, BandEffects, CoverEffects, TrackEffects, albumsFeature } from '@metal-p3/shared/data-access';
import { ErrorsHandler } from '@metal-p3/shared/error';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideState, provideStore } from '@ngrx/store';
import { StoreDevtoolsOptions, provideStoreDevtools } from '@ngrx/store-devtools';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

const options: StoreDevtoolsOptions | undefined = !environment.production
  ? {
      maxAge: 100,
      logOnly: environment.production,
    }
  : undefined;

const config: SocketIoConfig = { url: environment.wsUrl, options: { transports: ['websocket'] } };

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule, SocketIoModule.forRoot(config)),
    provideRouterStore(),
    provideStore({ router: routerReducer }),
    provideState(albumsFeature),
    provideState(playerFeature),
    provideState(playlistFeature),
    provideStoreDevtools(options),
    provideEffects([AlbumEffects, BandEffects, CoverEffects, TrackEffects, PlayerEffects, PlaylistEffects]),
    { provide: API, useValue: environment.api },
    { provide: BASE_PATH, useValue: environment.baseFolderLocation },
    { provide: TAKE, useValue: environment.take },
    { provide: ErrorHandler, useClass: ErrorsHandler },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'fill', subscriptSizing: 'dynamic' } },
  ],
}).catch((err) => console.error(err));
