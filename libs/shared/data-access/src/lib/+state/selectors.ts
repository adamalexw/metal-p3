import { createSelector } from '@ngrx/store';
import { selectAlbum } from './album/selectors';
import { selectCurrentRoute } from './router.selectors';
import { selectTracks } from './track/selectors';

export * from './album/selectors';
export * from './band/selectors';
export * from './cover/selectors';
export * from './router.selectors';
export * from './track/selectors';

export const sideNavOpen = createSelector(selectCurrentRoute, (route) => !!route?.routeConfig);
export const selectAlbumSaving = createSelector(selectAlbum, selectTracks, (album, tracks) => album?.saving || tracks?.some((track) => track.trackSaving));
