import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PlayerEffects } from './+state/effects';
import { PLAYER_FEATURE_KEY, reducer } from './+state/reducer';

@NgModule({
  imports: [CommonModule, StoreModule.forFeature(PLAYER_FEATURE_KEY, reducer), EffectsModule.forFeature([PlayerEffects])],
})
export class PlayerDataAccessModule {}
