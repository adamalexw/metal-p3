import { createReducer } from '@ngrx/store';

export const MAINTENANCE_FEATURE_KEY = 'maintenance';

export interface MaintenanceState {}

export const initialState: MaintenanceState = {};

export const reducer = createReducer(initialState);
