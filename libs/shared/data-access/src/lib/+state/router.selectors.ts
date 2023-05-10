import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector } from '@ngrx/store';

export const selectRouter = createFeatureSelector<RouterReducerState>('router');

export const { selectCurrentRoute, selectRouteParams, selectRouteDataParam } = getRouterSelectors(selectRouter);

export const selectRouteId = selectRouteDataParam('id');
