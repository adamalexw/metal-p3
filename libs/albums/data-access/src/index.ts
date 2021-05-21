import { InjectionToken } from '@angular/core';

export * from './lib/+state/actions';
export * from './lib/+state/router.selectors';
export * from './lib/+state/selectors';
export * from './lib/album';
export * from './lib/albums-data-access.module';
export * from './lib/albums.service';
export const BASE_PATH = new InjectionToken<string>('BASE_PATH');
