import { computed, effect, inject } from '@angular/core';
import { Album, BASE_PATH } from '@metal-p3/album/domain';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { BandStore } from '@metal-p3/band/data-access';
import { CoverService, CoverStore } from '@metal-p3/cover/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { nonNullable } from '@metal-p3/shared/utils';
import { WA_WINDOW } from '@ng-web-apis/common';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { addEntities, addEntity, removeAllEntities, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, EMPTY, map, mergeMap, of, pipe, switchMap, tap, throwError } from 'rxjs';
import { AlbumService } from './album.service';

export interface AlbumState {
  loading: boolean;
  loaded: boolean;
  loadError?: string;
  advancedSearchOpen: boolean;
  searchRequest: SearchRequest;
  creatingNew?: boolean;
  selectedAlbumId?: number;
}

const initialState: AlbumState = {
  loading: false,
  loaded: false,
  loadError: undefined,
  advancedSearchOpen: false,
  searchRequest: { skip: 65, take: 0 },
  creatingNew: false,
  selectedAlbumId: undefined,
};

function sortByDateCreated(a: Album, b: Album): number {
  return b.dateCreated.localeCompare(a.dateCreated);
}

export const AlbumStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<Album>(),
  withComputed((store) => ({
    selectedAlbum: computed(() => {
      const id = store.selectedAlbumId?.();
      return id ? store.entityMap()[id] : undefined;
    }),
    albums: computed(() => [...store.entities()].sort(sortByDateCreated)),
  })),
  withMethods(
    (
      store,
      service = inject(AlbumService),
      coverService = inject(CoverService),
      bandStore = inject(BandStore),
      errorService = inject(ErrorService),
      notificationService = inject(NotificationService),
      windowRef = inject(WA_WINDOW),
      basePath = inject(BASE_PATH),
    ) => ({
      toggleAdvancedSearch() {
        patchState(store, { advancedSearchOpen: !store.advancedSearchOpen() });
      },
      viewAlbum(id: number | undefined) {
        patchState(store, { selectedAlbumId: id });
      },
      clearSelectedAlbum() {
        patchState(store, { selectedAlbumId: undefined });
      },
      clearAlbums() {
        patchState(store, { selectedAlbumId: undefined }, removeAllEntities());
      },
      addAlbum(album: Album) {
        patchState(store, addEntity(album));
      },
      setAlbum(album: Album) {
        // use updateEntity or addEntity? Upsert is not built-in, but we can update if it exists
        if (store.entityMap()[album.id]) {
          patchState(store, updateEntity({ id: album.id, changes: album }));
        } else {
          patchState(store, addEntity(album));
        }
      },
      updateAlbum(id: number, changes: Partial<Album>) {
        patchState(store, updateEntity({ id, changes }));
      },

      loadAlbums: rxMethod<{ request: SearchRequest; cancel?: boolean }>(
        pipe(
          switchMap(({ request, cancel }) => {
            if (cancel) {
              return of();
            }
            patchState(store, { searchRequest: request, loading: true, loaded: false });

            return service.getAlbums(request).pipe(
              map((albumsDto) => {
                const albums = albumsDto.map((dto): Album => ({ ...dto }));
                const selectedId = store.selectedAlbumId?.();
                const selectedAlbum = selectedId ? store.entityMap()[selectedId] : undefined;

                const items = request.skip === 0 ? setAllEntities(albums) : addEntities(albums);
                patchState(store, items, { loading: false, loaded: albums.length < 65, loadError: undefined });

                if (selectedAlbum && selectedId && !store.entityMap()[selectedId]) {
                  patchState(store, addEntity(selectedAlbum));
                }
              }),
              catchError((error) => {
                patchState(store, { loading: false, loaded: false, loadError: errorService.getError(error) });
                return of();
              }),
            );
          }),
        ),
      ),

      getAlbum: rxMethod<number>(
        pipe(
          mergeMap((id) =>
            service.getAlbum(id).pipe(
              map((albumDto) => {
                if (store.entityMap()[id]) {
                  patchState(store, updateEntity({ id, changes: albumDto }));
                } else {
                  patchState(store, addEntity(albumDto));
                }
              }),
              catchError((error) => {
                patchState(store, updateEntity({ id, changes: { getError: errorService.getError(error) } }));
                return of();
              }),
            ),
          ),
        ),
      ),

      addNewAlbum: rxMethod<string>(
        pipe(
          mergeMap((folder) =>
            service.addNewAlbum(`${basePath}/${folder}`).pipe(
              nonNullable(),
              tap((albumDto) => notificationService.showInfo(albumDto.folder, 'New Album')),
              map((albumDto): Album => ({ ...albumDto })),
              concatMap((album) =>
                coverService.getCover(`${basePath}/${album.folder}`).pipe(
                  map((cover) => ({ ...album, cover })),
                  catchError((error) => {
                    notificationService.showError(`${folder}: ${errorService.getError(error)}`, 'Get Cover');
                    return of(album);
                  }),
                ),
              ),
              map((album) => {
                patchState(store, addEntity(album));
              }),
              catchError((error) => {
                notificationService.showError(`${folder}: ${errorService.getError(error)}`, 'New Album');
                return of();
              }),
            ),
          ),
        ),
      ),

      saveAlbum: rxMethod<{ album: Album; previousBandId?: number }>(
        pipe(
          tap(({ album }) => patchState(store, updateEntity({ id: album.id, changes: { saving: true } }))),
          mergeMap(({ album, previousBandId }) =>
            service.saveAlbum(album).pipe(
              map(() => {
                if (album.bandId > 0 && album.artist) {
                  bandStore.saveBand({
                    id: album.bandId,
                    name: album.artist,
                    genre: album.genre,
                    country: album.country,
                    metalArchiveUrl: album.artistUrl,
                  });
                }

                if (previousBandId && previousBandId !== album.bandId) {
                  bandStore.deleteIfOrphaned(previousBandId);
                }

                patchState(store, updateEntity({ id: album.id, changes: { ...album, saving: false, saveError: undefined } }));
              }),
              catchError((error) => {
                const errorMessage = errorService.getError(error);
                notificationService.showError(errorMessage, 'Save');
                patchState(store, updateEntity({ id: album.id, changes: { saving: false, saveError: errorMessage } }));
                return of();
              }),
            ),
          ),
        ),
      ),

      setHasLyrics: rxMethod<{ id: number; hasLyrics: boolean }>(
        pipe(
          mergeMap(({ id, hasLyrics }) =>
            service.setHasLyrics(id, hasLyrics).pipe(
              map(() => patchState(store, updateEntity({ id, changes: { hasLyrics } }))),
              catchError((error) => {
                console.error(error);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      setTransferred: rxMethod<{ id: number; transferred: boolean }>(
        pipe(
          mergeMap(({ id, transferred }) =>
            service.setTransferred(id, transferred).pipe(
              map(() => {
                patchState(store, updateEntity({ id, changes: { transferred, played: true } }));
                if (transferred) {
                  notificationService.showComplete('Album transferred successfully', 'Transfer');
                }
              }),
              catchError((error) => {
                console.error(error);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      setPlayed: rxMethod<{ id: number; played: boolean }>(
        pipe(
          mergeMap(({ id, played }) =>
            service.setPlayed(id, played).pipe(
              map(() => patchState(store, updateEntity({ id, changes: { played } }))),
              catchError((error) => {
                console.error(error);
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      findMetalArchivesUrl: rxMethod<{ id: number; artist: string; album: string }>(
        pipe(
          tap(({ id }) => patchState(store, updateEntity({ id, changes: { findingUrl: true } }))),
          mergeMap(({ id, artist, album }) =>
            service.findMaUrl(artist, album).pipe(
              mergeMap((response) => {
                if (response.iTotalRecords > 1) {
                  const fullLengths = response.results.filter((r) => r.releaseType === 'Full-length');
                  if (fullLengths.length === 1) {
                    return of({ ...response, iTotalRecords: 1, results: fullLengths });
                  }
                  windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}&releaseTitle=${encodeURI(album)}`);
                  return throwError(() => new Error('too many results'));
                }
                if (response.iTotalRecords === 0) {
                  windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}`);
                  return throwError(() => new Error('no results'));
                }
                return of(response);
              }),
              map((response) => ({ artistUrl: response.results[0].artistUrl, albumUrl: response.results[0].albumUrl })),
              tap(({ artistUrl, albumUrl }) => {
                patchState(store, updateEntity({ id, changes: { artistUrl, albumUrl, findingUrl: false } }));
                const albumEntity = store.entityMap()[id];
                if (albumEntity && (!albumEntity.genre || !albumEntity.country)) {
                  bandStore.getProps({ id, url: artistUrl });
                }
              }),
              catchError((error) => {
                const isKnownError = typeof error === 'object' && error instanceof Error && ['no results', 'too many results'].includes(error.message);
                if (!isKnownError) {
                  console.error(error);
                }
                patchState(store, updateEntity({ id, changes: { findingUrl: false } }));
                return of();
              }),
            ),
          ),
        ),
      ),

      renameFolder: rxMethod<{ id: number; src: string; artist: string; album: string }>(
        pipe(
          tap(({ id }) => patchState(store, updateEntity({ id, changes: { renamingFolder: true, renamingFolderError: undefined } }))),
          mergeMap(({ id, src, artist, album }) =>
            service.renameFolder(id, src, `${artist} - ${album}`).pipe(
              map(({ fullPath, folder }) => {
                patchState(store, updateEntity({ id, changes: { fullPath, folder, renamingFolder: false, renamingFolderError: undefined } }));
              }),
              catchError((error) => {
                patchState(store, updateEntity({ id, changes: { renamingFolder: false, renamingFolderError: errorService.getError(error) } }));
                return of();
              }),
            ),
          ),
        ),
      ),

      createNew: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { creatingNew: true })),
          mergeMap(() =>
            service.createAlbumFromRootFiles().pipe(
              map(() => patchState(store, { creatingNew: false })),
              catchError((error) => {
                notificationService.showError(`${errorService.getError(error)}`, 'Create New Album');
                patchState(store, { creatingNew: false });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),

      deleteAlbum: rxMethod<number>(
        pipe(
          tap((id) => patchState(store, updateEntity({ id, changes: { deleting: true, deleteError: undefined } }))),
          mergeMap((id) =>
            service.deleteAlbum(id).pipe(
              map(() => patchState(store, removeEntity(id))),
              catchError((error) => {
                notificationService.showError(`${errorService.getError(error)}`, 'Delete Album');
                patchState(store, updateEntity({ id, changes: { deleting: false, deleteError: errorService.getError(error) } }));
                return of();
              }),
            ),
          ),
        ),
      ),
    }),
  ),
  withHooks({
    onInit(store) {
      const coverStore = inject(CoverStore);

      effect(() => {
        const albumId = store.selectedAlbumId?.();
        if (albumId) {
          const album = store.entityMap()[albumId];
          if (!album && !store.loading()) {
            store.getAlbum(albumId);
          } else if (album) {
            if (!album.cover && !coverStore.entityMap()[albumId]?.cover && !coverStore.entityMap()[albumId]?.loading) {
              coverStore.getCover({ id: albumId, folder: album.folder });
            }
          }
        }
      });
    },
  }),
);
