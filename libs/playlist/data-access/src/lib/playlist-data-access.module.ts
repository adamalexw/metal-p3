import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { PLAYLIST_FEATURE_KEY, reducer } from './+state/reducer';
import { EffectsModule } from '@ngrx/effects';
import { PlayerEffects } from './+state/effects';

@NgModule({
  imports: [CommonModule, StoreModule.forFeature(PLAYLIST_FEATURE_KEY, reducer), EffectsModule.forFeature([PlayerEffects])],
})
export class PlaylistDataAccessModule {}
