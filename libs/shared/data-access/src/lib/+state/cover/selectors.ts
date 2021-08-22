import { createSelector } from '@ngrx/store';
import { selectAlbum, selectAlbumById } from '../album/selectors';
import { selectAlbums } from '../selectors';

export const selectCoverLoading = createSelector(selectAlbum, (album) => album?.coverLoading || false);
export const selectCover = createSelector(selectAlbum, (album) => album?.cover);
export const selectCoverError = createSelector(selectAlbum, (album) => album?.coverError);
export const selectBlobCovers = createSelector(selectAlbums, (albums) => albums?.filter((album) => album.cover && album.cover.startsWith('blob')).map((album) => album.cover) || []);
export const selectCoverLoadingByAlbumId = (id: number) => createSelector(selectAlbumById(id), (album) => album?.coverLoading);
