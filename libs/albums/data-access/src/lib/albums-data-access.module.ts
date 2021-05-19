import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { AlbumEffects } from './+state/effects';
import * as fromAlbum from './+state/reducer';
import { ALBUMS_FEATURE_KEY } from './+state/reducer';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    StoreModule.forRoot({ [ALBUMS_FEATURE_KEY]: fromAlbum.reducer, router: routerReducer }),
    EffectsModule.forRoot([AlbumEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 100,
      logOnly: false,
      features: {
        pause: false,
        lock: true,
        persist: true,
      },
    }),
    StoreRouterConnectingModule.forRoot(),
  ],
})
export class AlbumsDataAccessModule {}
