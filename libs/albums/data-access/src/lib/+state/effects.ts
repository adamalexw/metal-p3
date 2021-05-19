import { Inject, Injectable } from '@angular/core';
import { MetalArchivesSearchResponse } from '@metal-p3/api-interfaces';
import { environment } from '@metal-p3/env';
import { extractUrl } from '@metal-p3/shared/utils';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { Album, AlbumDtoToAlbum } from '../album';
import { AlbumsService } from '../albums.service';
import {
  addAlbum,
  addNewAlbum,
  downloadCover,
  findMaUrl,
  findMaUrlSuccess,
  getAlbum,
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
  saveAlbum,
  saveAlbumSuccess,
  saveBand,
  saveTrack,
  saveTrackSuccess,
  updateAlbum,
} from './actions';

@Injectable()
export class AlbumEffects {
  loadAlbums$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAlbums),
      mergeMap(({ request }) =>
        this.albumsService.getAlbums(request).pipe(
          map((albums) => albums as Album[]),
          map((albums) => loadAlbumsSuccess({ albums })),
          catchError(() => EMPTY)
        )
      )
    )
  );

  getCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getCover),
      mergeMap(({ id, folder }) =>
        this.albumsService.getCover(`${environment.baseFolderLocation}/${folder}`).pipe(
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
        this.albumsService.addNewAlbum(`${environment.baseFolderLocation}/${folder}`).pipe(
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
        this.albumsService.getTracks(`${environment.baseFolderLocation}/${folder}`).pipe(
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
          tap((response) => {
            if (response.iTotalRecords > 1) {
              this.windowRef.open(`https://www.metal-archives.com/search/advanced/searching/albums?bandName=${encodeURI(artist)}&releaseTitle=${encodeURI(album)}`);
            }
          }),
          filter((response) => response.iTotalRecords === 1),
          map((response: MetalArchivesSearchResponse) => {
            return { artistUrl: extractUrl(response.aaData[0][0]), albumUrl: extractUrl(response.aaData[0][1]) };
          }),
          map(({ artistUrl, albumUrl }) => findMaUrlSuccess({ update: { id, changes: { artistUrl, albumUrl, findingUrl: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
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

  constructor(private actions$: Actions, private albumsService: AlbumsService, private store: Store, @Inject(WINDOW) readonly windowRef: Window) {}
}
