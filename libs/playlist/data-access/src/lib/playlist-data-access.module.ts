import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PlayerEffects } from './+state/effects';
import { PLAYLIST_FEATURE_KEY, reducer } from './+state/reducer';

@NgModule({
  imports: [StoreModule.forFeature(PLAYLIST_FEATURE_KEY, reducer), EffectsModule.forFeature([PlayerEffects])],
})
export class PlaylistDataAccessModule {}
