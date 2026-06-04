import { inject, Injectable } from '@angular/core';
import { BASE_PATH } from '@metal-p3/album/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { TrackService } from '@metal-p3/track/data-access';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { buffer, catchError, concatMap, debounceTime, EMPTY, filter, map, mergeMap, of, tap, timeout } from 'rxjs';
import { TrackActions } from './actions';
import { selectTrack } from './selectors';

@Injectable()
export class TrackEffects {
  private readonly actions$ = inject(Actions);
  private readonly service = inject(TrackService);
  private readonly store = inject(Store);
  private readonly basePath = inject(BASE_PATH);
  private readonly errorService = inject(ErrorService);
  private readonly notificationService = inject(NotificationService);

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
      concatMap(({ id, track }) =>
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

  saveTracks$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.saveTracks),
      mergeMap(({ id, tracks }) =>
        this.service.saveTracks(tracks).pipe(
          map(() => TrackActions.saveTracksSuccess({ id, tracks })),
          catchError((error) => {
            console.error(error);
            return of(TrackActions.saveTracksError({ id, tracks, error: this.errorService.getError(error) }));
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
            return of(TrackActions.getMetalArchivesTracksError({ id }));
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
          timeout(60_000),
          map((lyrics) => TrackActions.getLyricsSuccess({ id, trackId, lyrics })),
          catchError((error) => of(TrackActions.getLyricsError({ id, trackId, error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  getSyncedLyrics$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.getSyncedLyrics),
      mergeMap(({ id, localTrackId, maTrackId, artist, track, album, durationSeconds }) =>
        this.service.getSyncedLyrics({ artist, track, album, durationSeconds }).pipe(
          timeout(20_000),
          map((result) => {
            if (result?.syncedLyrics && !result.instrumental) {
              return TrackActions.getSyncedLyricsSuccess({ id, localTrackId, maTrackId, syncedLyrics: result.syncedLyrics });
            }
            return TrackActions.getSyncedLyricsMiss({ id, localTrackId, maTrackId });
          }),
          catchError(() => of(TrackActions.getSyncedLyricsMiss({ id, localTrackId, maTrackId }))),
        ),
      ),
    );
  });

  syncedLyricsFallback$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.getSyncedLyricsMiss),
      map(({ id, maTrackId }) => TrackActions.getLyrics({ id, trackId: maTrackId })),
    );
  });

  renameTrack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.renameTrack),
      mergeMap(({ id, track }) =>
        this.service.renameTrack(track).pipe(
          map(({ fullPath, file }) => TrackActions.renameTrackSuccess({ id, trackId: track.id, fullPath, file })),
          catchError((error) => of(TrackActions.renameTrackError({ id, trackId: track.id, error: this.errorService.getError(error) }))),
        ),
      ),
    );
  });

  transferTrack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TrackActions.transferTrack),
      concatLatestFrom(({ id, trackId }) => this.store.select(selectTrack(id, trackId))),
      mergeMap(([{ id }, track]) => {
        if (!track) return EMPTY;
        return this.service.transferTrack(track.fullPath).pipe(
          map(() => TrackActions.transferTrackSuccess({ id, track: { ...track, trackTransferring: false } })),
          catchError((error) => {
            console.error(error);
            return of(TrackActions.transferTrackError({ id, track: { ...track, trackTransferring: false } }));
          }),
        );
      }),
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

  notifySaveTracks$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(TrackActions.saveTracksSuccess),
        tap(() => this.notificationService.showComplete('Lyrics applied')),
      );
    },
    { dispatch: false },
  );

  notifyTransferBatch$ = createEffect(
    () => {
      const transferEnd$ = this.actions$.pipe(ofType(TrackActions.transferTrackSuccess, TrackActions.transferTrackError));
      return transferEnd$.pipe(
        buffer(transferEnd$.pipe(debounceTime(500))),
        filter((batch) => batch.length > 0),
        tap((batch) => {
          const errors = batch.filter((a) => a.type === TrackActions.transferTrackError.type).length;
          const successes = batch.length - errors;
          if (errors === 0) {
            this.notificationService.showComplete(`Transferred ${successes} track${successes === 1 ? '' : 's'}`);
          } else if (successes === 0) {
            this.notificationService.showError(`Failed to transfer ${errors} track${errors === 1 ? '' : 's'}`, 'Transfer');
          } else {
            this.notificationService.showError(`Transferred ${successes}, failed ${errors}`, 'Transfer');
          }
        }),
      );
    },
    { dispatch: false },
  );
}
