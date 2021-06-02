import { createSelector } from '@ngrx/store';
import { selectAlbum } from '../album/selectors';

export const selectBandProps = createSelector(selectAlbum, (album) => album?.bandProps);
export const selectGettingBandProps = createSelector(selectAlbum, (album) => album?.gettingBandProps);
