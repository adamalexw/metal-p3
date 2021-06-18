/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@angular/core';
import { BASE_PATH } from '@metal-p3/album/domain';
import { Track } from '@metal-p3/api-interfaces';
import { TrackService } from '@metal-p3/track/data-access';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import {
  getLyrics,
  getLyricsSuccess,
  getMaTracks,
  getMaTracksSuccess,
  getTracks,
  getTracksSuccess,
  renameTrack,
  renameTrackSuccess,
  saveTrack,
  saveTrackSuccess,
  transferTrack,
  transferTrackSuccess,
} from './actions';
import { selectTrack } from './selectors';

@Injectable()
export class TrackEffects {
  getTracks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getTracks),
      mergeMap(({ id, folder }) =>
        this.service.getTracks(`${this.basePath}/${folder}`).pipe(
          map((tracks) => getTracksSuccess({ id, tracks })),
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
        this.service.saveTrack(track).pipe(
          map(() => saveTrackSuccess({ id, track })),
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
        this.service.getMaTracks(url).pipe(
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
        this.service.getLyrics(trackId).pipe(
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
        this.service.renameTrack(track).pipe(
          map(({ fullPath, file }) => renameTrackSuccess({ id, track: { ...track, fullPath, file } })),
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
        this.service.transferTrack(track?.fullPath || '').pipe(
          map(() => transferTrackSuccess({ id, track: { ...(track as Track), trackTransferring: false } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  constructor(private actions$: Actions, private service: TrackService, private store: Store, @Inject(BASE_PATH) private readonly basePath: string) {}
}
