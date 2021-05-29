/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@angular/core';
import { MetalArchivesSearchResponse, Track } from '@metal-p3/api-interfaces';
import { extractUrl } from '@metal-p3/shared/utils';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { EMPTY, of, throwError } from 'rxjs';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { BASE_PATH } from '../..';
import { Album, AlbumDtoToAlbum } from '../album';
import { AlbumsService } from '../albums.service';
import {
  addAlbum,
  addNewAlbum,
  clearCovers,
  downloadCover,
  findMaUrl,
  findMaUrlSuccess,
  getAlbum,
  getBandProps,
  getBandPropsSuccess,
  getCover,
  getCoverSuccess,
  getLyrics,
  getLyricsSuccess,
  getMaTracks,
  getMaTracksSuccess,
  getTracks,
  getTracksSuccess,
  loadAlbums,
  loadAlbumsSuccess,
  renameFolder,
  renameFolderSuccess,
  renameTrack,
  renameTrackSuccess,
  saveAlbum,
  saveAlbumSuccess,
  saveBand,
  saveCover,
  saveCoverSuccess,
  saveTrack,
  saveTrackSuccess,
  transferTrack,
  transferTrackSuccess,
  updateAlbum,
} from './actions';
import { selectAlbumById, selectBlobCovers, selectTrack } from './selectors';

@Injectable()
export class AlbumEffects {
  loadAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAlbums),
      mergeMap(({ request }) =>
        this.albumsService.getAlbums(request).pipe(
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

  getCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getCover),
      mergeMap(({ id, folder }) =>
        this.albumsService.getCover(`${this.basePath}/${folder}`).pipe(
          map((cover) => getCoverSuccess({ update: { id, changes: { cover, coverLoading: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  downloadCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(downloadCover),
      mergeMap(({ id, url }) =>
        this.albumsService.downloadCover(url).pipe(
          map((cover) => updateAlbum({ update: { id, changes: { cover } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  clearCovers$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearCovers),
        concatLatestFrom(() => this.store.pipe(select(selectBlobCovers))),
        filter(([_, covers]) => covers.length > 0),
        tap(([_, covers]) =>
          covers.forEach((cover) => {
            typeof cover === 'string' ? URL.revokeObjectURL(cover) : '';
          })
        )
      ),
    { dispatch: false }
  );

  getAlbum$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getAlbum),
      mergeMap(({ id }) =>
        this.albumsService.getAlbum(id).pipe(
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
        this.albumsService.addNewAlbum(`${this.basePath}/${folder}`).pipe(
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

  getTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getTracks),
      mergeMap(({ id, folder }) =>
        this.albumsService.getTracks(`${this.basePath}/${folder}`).pipe(
          map((tracks) => getTracksSuccess({ id, tracks })),
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
        this.albumsService.saveAlbum(album).pipe(
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

  saveCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveCover),
      mergeMap(({ id, folder, cover }) =>
        this.albumsService.saveCover(folder, cover).pipe(
          map(() => saveCoverSuccess({ update: { id, changes: { savingCover: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  saveTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveTrack),
      mergeMap(({ id, track }) =>
        this.albumsService.saveTrack(track).pipe(
          map(() => saveTrackSuccess({ id, track })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  saveBand$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(saveBand),
        mergeMap(({ band }) =>
          this.albumsService.saveBand(band).pipe(
            catchError((error) => {
              console.error(error);
              return EMPTY;
            })
          )
        )
      ),
    { dispatch: false }
  );

  findMaUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType(findMaUrl),
      mergeMap(({ id, artist, album }) =>
        this.albumsService.findMaUrl(artist, album).pipe(
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

  getMaTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getMaTracks),
      mergeMap(({ id, url }) =>
        this.albumsService.getMaTracks(url).pipe(
          map((maTracks) => getMaTracksSuccess({ id, maTracks })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  getLyrics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getLyrics),
      mergeMap(({ id, trackId }) =>
        this.albumsService.getLyrics(trackId).pipe(
          map((lyrics) => getLyricsSuccess({ id, trackId, lyrics })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  renameTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(renameTrack),
      mergeMap(({ id, track }) =>
        this.albumsService.renameTrack(track).pipe(
          map((newName) => renameTrackSuccess({ id, track: { ...track, fullPath: newName } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
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
        this.albumsService.renameFolder(id, src || '', dest).pipe(
          map((newFullPath) => renameFolderSuccess({ update: { id, changes: { fullPath: newFullPath } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  getBandProps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getBandProps),
      mergeMap(({ id, url }) =>
        this.albumsService.getBandProps(url).pipe(
          map((band) => getBandPropsSuccess({ update: { id, changes: { bandProps: band, gettingBandProps: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  transferTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(transferTrack),
      concatLatestFrom(({ id, trackId }) => this.store.select(selectTrack(id, trackId))),
      mergeMap(([{ id }, track]) =>
        this.albumsService.transferTrack(track?.fullPath || '').pipe(
          map(() => transferTrackSuccess({ id, track: { ...(track as Track), trackTransfering: false } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private albumsService: AlbumsService,
    private store: Store,
    @Inject(WINDOW) readonly windowRef: Window,
    @Inject(BASE_PATH) private readonly basePath: string
  ) {}
}
