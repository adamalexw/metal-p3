/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@angular/core';
import { BASE_PATH } from '@metal-p3/album/domain';
import { Track } from '@metal-p3/api-interfaces';
import { ErrorService } from '@metal-p3/shared/error';
import { TrackService } from '@metal-p3/track/data-access';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import {
  deleteTrack,
  deleteTrackError,
  deleteTrackSuccess,
  getLyrics,
  getLyricsError,
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
          catchError((error) => of(getLyricsError({ id, trackId, error: this.errorService.getError(error) })))
        )
      )
    )
  );

  renameTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(renameTrack),
      mergeMap(({ id, track }) =>
        this.service.renameTrack(track).pipe(
          map(({ fullPath, file }) => renameTrackSuccess({ id, trackId: track.id, fullPath, file })),
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

  deleteTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteTrack),
      mergeMap(({ id, track }) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.service.deleteTrack(track.fullPath!).pipe(
          map(() => deleteTrackSuccess({ id, track })),
          catchError((error) => of(deleteTrackError({ id, trackId: track.id, error: this.errorService.getError(error) })))
        )
      )
    )
  );

  constructor(private actions$: Actions, private service: TrackService, private store: Store, @Inject(BASE_PATH) private readonly basePath: string, private errorService: ErrorService) {}
}
