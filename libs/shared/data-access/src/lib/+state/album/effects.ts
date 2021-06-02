/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@angular/core';
import { AlbumService } from '@metal-p3/albums/data-access';
import { BASE_PATH } from '@metal-p3/albums/domain';
import { MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { extractUrl } from '@metal-p3/shared/utils';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap } from 'rxjs/operators';
import { Album, AlbumDtoToAlbum } from '../model';
import { addAlbum, addNewAlbum, findMaUrl, findMaUrlSuccess, getAlbum, loadAlbums, loadAlbumsSuccess, renameFolder, renameFolderSuccess, saveAlbum, saveAlbumSuccess } from './actions';
import { selectAlbumById } from './selectors';

@Injectable()
export class AlbumEffects {
  loadAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAlbums),
      mergeMap(({ request }) =>
        this.service.getAlbums(request).pipe(
          map((albums) => albums as Album[]),
          map((albums) => loadAlbumsSuccess({ albums })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
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
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  addNewAlbum$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addNewAlbum),
      mergeMap(({ folder }) =>
        this.service.addNewAlbum(`${this.basePath}/${folder}`).pipe(
          map((album) => AlbumDtoToAlbum(album) as Album),
          map((album) => addAlbum({ album })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
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
            const { cover, ...rest } = album;
            return rest;
          }),
          map((album) => saveAlbumSuccess({ update: { id: album.id, changes: { ...album, saving: false } } })),
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
      concatLatestFrom(({ id }) => this.store.select(selectAlbumById(id))),
      map(([{ id }, album]) => ({ id, src: album?.fullPath, dest: `${album?.artist} - ${album?.album}` })),
      mergeMap(({ id, src, dest }) =>
        this.service.renameFolder(id, src || '', dest).pipe(
          map((newFullPath) => renameFolderSuccess({ update: { id, changes: { fullPath: newFullPath } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  constructor(private actions$: Actions, private service: AlbumService, private store: Store, @Inject(WINDOW) readonly windowRef: Window, @Inject(BASE_PATH) private readonly basePath: string) {}
}
