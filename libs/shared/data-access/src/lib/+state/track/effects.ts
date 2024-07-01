import { Inject, Injectable } from '@angular/core';
import { BASE_PATH } from '@metal-p3/album/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { TrackService } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { TrackActions } from './actions';
import { selectTrack } from './selectors';

@Injectable()
export class TrackEffects {
  getTracks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.getTracks),
      mergeMap(({ id, folder }) =>
        this.service.getTracks(`${this.basePath}/${folder}`).pipe(
          map((tracks) => TrackActions.getTracksSuccess({ id, tracks })),
          catchError((error) => of(TrackActions.getTracksError({ id, error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  saveTrack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.saveTrack),
      mergeMap(({ id, track }) =>
        this.service.saveTrack(track).pipe(
          map(() => TrackActions.saveTrackSuccess({ id, track })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          }),
        ),
      ),
    );
  });

  getMaTracks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.getMetalArchivesTracks),
      mergeMap(({ id, url }) =>
        this.service.getMaTracks(url).pipe(
          map((maTracks) => TrackActions.getMetalArchivesTracksSuccess({ id, maTracks })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          }),
        ),
      ),
    );
  });

  getLyrics$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.getLyrics),
      mergeMap(({ id, trackId }) =>
        this.service.getLyrics(trackId).pipe(
          map((lyrics) => TrackActions.getLyricsSuccess({ id, trackId, lyrics })),
          catchError((error) => of(TrackActions.getLyricsError({ id, trackId, error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  renameTrack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.renameTrack),
      mergeMap(({ id, track }) =>
        this.service.renameTrack(track).pipe(
          map(({ fullPath, file }) => TrackActions.renameTrackSuccess({ id, trackId: track.id, fullPath, file })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          }),
        ),
      ),
    );
  });

  transferTrack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.transferTrack),
      concatLatestFrom(({ id, trackId }) => this.store.select(selectTrack(id, trackId))),
      mergeMap(([{ id }, track]) =>
        this.service.transferTrack(track?.fullPath || '').pipe(
          map(() => TrackActions.transferTrackSuccess({ id, track: { ...(track as Track), trackTransferring: false } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          }),
        ),
      ),
    );
  });

  deleteTrack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.deleteTrack),
      mergeMap(({ id, track }) =>
        this.service.deleteTrack(track.fullPath || '').pipe(
          map(() => TrackActions.deleteTrackSuccess({ id, track })),
          catchError((error) => of(TrackActions.deleteTrackError({ id, trackId: track.id, error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly service: TrackService,
    private readonly store: Store,
    @Inject(BASE_PATH) private readonly basePath: string,
    private errorService: ErrorService,
  ) {}
}
