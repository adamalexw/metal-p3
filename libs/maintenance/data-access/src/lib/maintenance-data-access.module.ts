import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedErrorModule } from '@metal-p3/shared/error';
import { NotificationModule } from '@metal-p3/shared/feedback';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MaintenanceEffects } from './+state/effects';
import { MAINTENANCE_FEATURE_KEY, reducer } from './+state/reducer';

@NgModule({
  imports: [CommonModule, NotificationModule, SharedErrorModule, StoreModule.forFeature(MAINTENANCE_FEATURE_KEY, reducer), EffectsModule.forFeature([MaintenanceEffects])],
})
export class MaintenanceDataAccessModule {}
