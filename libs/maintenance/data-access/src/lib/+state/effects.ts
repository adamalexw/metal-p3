import { Injectable } from '@angular/core';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, iif, of } from 'rxjs';
import { catchError, concatMap, map, mapTo, tap } from 'rxjs/operators';
import { LyricsMaintenanceService } from '../lyrics.service';
import {
  addLyricsPriority,
  checkedLyricsHistory,
  checkedLyricsHistoryError,
  checkedLyricsHistorySuccess,
  checkLyricsHistory,
  checkLyricsHistoryError,
  checkLyricsHistorySuccess,
  deleteLyricsHistory,
  deleteLyricsHistoryError,
  deleteLyricsHistorySuccess,
  getLyricsHistory,
  getLyricsHistoryError,
  getLyricsHistorySuccess,
} from './actions';

@Injectable()
export class MaintenanceEffects {
  addLyricsPriority$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(addLyricsPriority),
        concatMap(({ albumId }) => this.lyricsService.addPriority(albumId)),
        tap(() => this.notificationService.showComplete('Lyrics Priority Added')),
        catchError((error) => {
          this.notificationService.showError(this.errorService.getError(error), 'Lyrics Priority Added');
          return EMPTY;
        })
      ),
    { dispatch: false }
  );

  getLyricsHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getLyricsHistory),
      concatMap(({ priority }) => iif(() => priority, this.lyricsService.getPriority(), this.lyricsService.getHistory())),
      map((history) => getLyricsHistorySuccess({ history })),
      catchError((error) => of(getLyricsHistoryError({ error: this.errorService.getError(error) })))
    )
  );

  checkLyricsHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(checkLyricsHistory),
      concatMap(({ priority }) => iif(() => priority, this.lyricsService.checkPriority(), this.lyricsService.checkHistory())),
      mapTo(checkLyricsHistorySuccess()),
      catchError((error) => of(checkLyricsHistoryError({ error: this.errorService.getError(error) })))
    )
  );

  checkedLyricsHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(checkedLyricsHistory),
      concatMap(({ id, checked }) =>
        this.lyricsService.checkedLyricsHistory(id, checked).pipe(
          map(() => checkedLyricsHistorySuccess({ update: { id, changes: { checked } } })),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Checked Lyrics History');
            return of(checkedLyricsHistoryError({ id, error }));
          })
        )
      )
    )
  );

  deleteLyricsHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteLyricsHistory),
      concatMap(({ id }) =>
        this.lyricsService.deleteLyricsHistory(id).pipe(
          map(() => deleteLyricsHistorySuccess({ id })),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Delete Lyrics History');
            return of(deleteLyricsHistoryError({ id, error }));
          })
        )
      )
    )
  );

  constructor(private actions$: Actions, private lyricsService: LyricsMaintenanceService, private errorService: ErrorService, private notificationService: NotificationService) {}
}
