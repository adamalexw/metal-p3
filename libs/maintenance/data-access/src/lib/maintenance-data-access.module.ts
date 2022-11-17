import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MaintenanceEffects } from './+state/effects';
import { MAINTENANCE_FEATURE_KEY, reducer } from './+state/reducer';

@NgModule({
  imports: [StoreModule.forFeature(MAINTENANCE_FEATURE_KEY, reducer), EffectsModule.forFeature([MaintenanceEffects])],
})
export class MaintenanceDataAccessModule {}
