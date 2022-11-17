import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AlbumEffects } from './+state/album/effects';
import { BandEffects } from './+state/band/effects';
import { CoverEffects } from './+state/cover/effects';
import { ALBUMS_FEATURE_KEY, reducer } from './+state/reducer';
import { TrackEffects } from './+state/track/effects';

@NgModule({
  imports: [HttpClientModule, StoreModule.forFeature(ALBUMS_FEATURE_KEY, reducer), EffectsModule.forFeature([AlbumEffects, BandEffects, CoverEffects, TrackEffects])],
})
export class SharedDataAccessModule {}
