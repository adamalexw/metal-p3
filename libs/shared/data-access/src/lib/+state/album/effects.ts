import { Inject, Injectable } from '@angular/core';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { CoverService } from '@metal-p3/cover/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { extractUrl } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { select, Store } from '@ngrx/store';
import { EMPTY, forkJoin, iif, Observable, of, throwError } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { getCoverError } from '../cover/actions';
import { Album, AlbumDtoToAlbum } from '../model';
import { selectTracks } from '../selectors';
import { updateTracks } from '../track/actions';
import {
  addAlbum,
  addNewAlbum,
  addNewError,
  cancelLoadAlbums,
  cancelLoadAlbumsSuccess,
  createNew,
  createNewSuccess,
  deleteAlbum,
  deleteAlbumError,
  deleteAlbumSuccess,
  findMaUrl,
  findMaUrlSuccess,
  getAlbum,
  getAlbumError,
  getExtraFiles,
  loadAlbums,
  loadAlbumsError,
  loadAlbumsPageSuccess,
  loadAlbumsSuccess,
  renameFolder,
  renameFolderError,
  renameFolderSuccess,
  saveAlbum,
  saveAlbumError,
  saveAlbumSuccess,
  setExtraFiles,
  setHasLyrics,
  setTransferred,
  updateAlbum,
} from './actions';

@Injectable()
export class AlbumEffects {
  loadAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAlbums, cancelLoadAlbums),
      switchMap(({ request }) =>
        iif(
          () => !!request.cancel,
          of(cancelLoadAlbumsSuccess()),
          this.service.getAlbums(request).pipe(
            map((albums) => albums as Album[]),
            mergeMap((albums) => {
              if (!albums.length) {
                return of(albums);
              }

              const sources: Record<number, Observable<string>> = {};
              albums.forEach(
                (album) =>
                  (sources[album.id] = this.coverService.getCover(`${this.basePath}/${album.folder}`).pipe(
                    catchError((error) => {
                      this.store.dispatch(getCoverError({ update: { id: album.id, changes: { coverLoading: false, coverError: this.errorService.getError(error) } } }));
                      return of('/assets/blank.png');
                    })
                  ))
              );

              return forkJoin(sources).pipe(
                map((covers) => {
                  Object.keys(covers).forEach((key) => {
                    const album = albums.find((a) => a.id === +key);

                    if (album) {
                      album.cover = covers[key];
                    }
                  });

                  return albums;
                })
              );
            }),
            map((albums) => (!request.skip ? loadAlbumsSuccess({ albums }) : loadAlbumsPageSuccess({ albums }))),
            catchError((error) => of(loadAlbumsError({ loadError: error })))
          )
        )
      )
    )
  );

  getAlbum$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getAlbum),
      mergeMap(({ id }) =>
        this.service.getAlbum(id).pipe(
          map((album) => AlbumDtoToAlbum(album) as Album),
          map((album) => addAlbum({ album })),
          catchError((error) => of(getAlbumError({ update: { id, changes: { getError: this.errorService.getError(error) } } })))
        )
      )
    )
  );

  addNewAlbum$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addNewAlbum),
      mergeMap(({ folder }) =>
        this.service.addNewAlbum(`${this.basePath}/${folder}`).pipe(
          filter((album) => !!album),
          tap((album) => this.notificationService.showInfo(album.folder, 'New Album')),
          map((album) => AlbumDtoToAlbum(album) as Album),
          concatMap((album) => this.coverService.getCover(`${this.basePath}/${album.folder}`).pipe(map((cover) => ({ ...album, cover })))),
          map((album) => addAlbum({ album })),
          catchError((error) => {
            this.notificationService.showError(`${folder}: ${this.errorService.getError(error)}`, 'New Album');
            return of(addNewError({ error }));
          })
        )
      )
    )
  );

  extraFiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getExtraFiles),
      mergeMap(({ id, folder }) =>
        this.service.getExtraFiles(folder).pipe(
          map((extraFiles) => setExtraFiles({ update: { id, changes: { extraFiles } } })),
          catchError((error) => {
            this.notificationService.showError(`${folder}: ${this.errorService.getError(error)}`, 'Extra Files');
            return of(setExtraFiles({ update: { id, changes: { extraFiles: false } } }));
          })
        )
      )
    )
  );

  saveAlbum$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveAlbum),
      mergeMap(({ album }) =>
        this.service.saveAlbum(album).pipe(
          map(() => {
            const { cover: _, ...rest } = album;
            return rest;
          }),
          map((album) => saveAlbumSuccess({ update: { id: album.id, changes: { ...album, saving: false, saveError: undefined } } })),
          catchError((error) => of(saveAlbumError({ update: { id: album.id, changes: { saving: false, saveError: this.errorService.getError(error) } } })))
        )
      )
    )
  );

  setHasLyrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setHasLyrics),
      mergeMap(({ id, hasLyrics }) =>
        this.service.setHasLyrics(id, hasLyrics).pipe(
          map(() => updateAlbum({ update: { id, changes: { hasLyrics } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  setTransferred$ = createEffect(() =>
    this.actions$.pipe(
      ofType(setTransferred),
      mergeMap(({ id, transferred }) =>
        this.service.setTransferred(id, transferred).pipe(
          map(() => updateAlbum({ update: { id, changes: { transferred } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  findMaUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType(findMaUrl),
      mergeMap(({ id, artist, album }) =>
        this.service.findMaUrl(artist, album).pipe(
          mergeMap((response) => {
            if (response.iTotalRecords > 1) {
              this.windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}&releaseTitle=${encodeURI(album)}`);
              return throwError('too many results');
            }
            if (response.iTotalRecords === 0) {
              this.windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}`);
              return throwError('no results');
            }

            return of(response);
          }),
          filter((response) => response.iTotalRecords === 1),
          map((response: MetalArchivesSearchResponse) => {
            return { artistUrl: extractUrl(response.aaData[0][0]), albumUrl: extractUrl(response.aaData[0][1]) };
          }),
          map(({ artistUrl, albumUrl }) => findMaUrlSuccess({ update: { id, changes: { artistUrl, albumUrl, findingUrl: false } } })),
          catchError((error) => {
            console.error(error);
            return of(findMaUrlSuccess({ update: { id, changes: { findingUrl: false } } }));
          })
        )
      )
    )
  );

  renameFolder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(renameFolder),
      map(({ id, src, artist, album }) => ({ id, src, dest: `${artist} - ${album}` })),
      mergeMap(({ id, src, dest }) =>
        this.service.renameFolder(id, src, dest).pipe(
          map(({ fullPath, folder }) => renameFolderSuccess({ update: { id, changes: { fullPath, folder, renamingFolder: false, renamingFolderError: undefined } } })),
          catchError((error) => of(renameFolderError({ update: { id, changes: { renamingFolder: false, renamingFolderError: this.errorService.getError(error) } } })))
        )
      )
    )
  );

  renameFolderSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(renameFolderSuccess),
      map(({ update }) => ({ id: update.id, fullPath: update.changes.fullPath })),
      concatLatestFrom(() => this.store.pipe(select(selectTracks))),
      filter(([_, tracks]) => !!tracks),
      map(([{ id, fullPath }, tracks]) => {
        const updates = (tracks || []).map((track) => ({ id: track.id, changes: { folder: fullPath, fullPath: `${fullPath}/${track.file}` } })) as Update<Track>[];

        return updateTracks({ id: +id, updates });
      })
    )
  );

  createNew$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createNew),
      mergeMap(() =>
        this.service.createAlbumFromRootFiles().pipe(
          map((newAlbums) => {
            if (newAlbums.length) {
              newAlbums.forEach((folder) => this.store.dispatch(addNewAlbum({ folder })));
            }

            return createNewSuccess();
          }),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  deleteAlbum$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteAlbum),
      mergeMap(({ id }) =>
        this.service.deleteAlbum(id).pipe(
          map(() => deleteAlbumSuccess({ id })),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Delete Album');
            return of(deleteAlbumError({ id, error }));
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private service: AlbumService,
    private coverService: CoverService,
    private store: Store,
    private notificationService: NotificationService,
    private errorService: ErrorService,
    @Inject(WINDOW) readonly windowRef: Window,
    @Inject(BASE_PATH) private readonly basePath: string
  ) {}
}
