import { Injectable } from '@angular/core';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY, iif, of } from 'rxjs';
import { catchError, concatMap, concatMapTo, map, tap } from 'rxjs/operators';
import { LyricsMaintenanceService } from '../lyrics.service';
import { UrlMaintenanceService } from '../url.service';
import { MaintenanceActions } from './actions';

@Injectable()
export class MaintenanceEffects {
  addLyricsPriority$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(MaintenanceActions.addLyricsPriority),
        concatMap(({ albumId }) => this.lyricsService.addPriority(albumId)),
        tap(() => this.notificationService.showComplete('Lyrics Priority Added')),
        catchError((error) => {
          this.notificationService.showError(this.errorService.getError(error), 'Lyrics Priority Error');
          return EMPTY;
        })
      );
    },
    { dispatch: false }
  );

  getLyricsHistory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MaintenanceActions.getLyricsHistory),
      concatMap(({ priority }) => iif(() => priority, this.lyricsService.getPriority(), this.lyricsService.getHistory())),
      map((history) => MaintenanceActions.getLyricsHistorySuccess({ history })),
      catchError((error) => of(MaintenanceActions.getLyricsHistoryError({ error: this.errorService.getError(error) })))
    );
  });

  checkLyricsHistory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MaintenanceActions.checkLyricsHistory),
      concatMap(({ priority }) => iif(() => priority, this.lyricsService.checkPriority(), this.lyricsService.checkHistory())),
      map(() => MaintenanceActions.checkLyricsHistorySuccess()),
      catchError((error) => of(MaintenanceActions.checkLyricsHistoryError({ error: this.errorService.getError(error) })))
    );
  });

  checkedLyricsHistory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MaintenanceActions.checkedLyricsHistory),
      concatMap(({ id, checked }) =>
        this.lyricsService.checkedLyricsHistory(id, checked).pipe(
          map(() => MaintenanceActions.checkedLyricsHistorySuccess({ update: { id, changes: { checked } } })),
          catchError((error) => {
            this.notificationService.showError(this.errorService.getError(error), 'Checked Lyrics History Error');
            return of(MaintenanceActions.checkedLyricsHistoryError({ id, error }));
          })
        )
      )
    );
  });

  deleteLyricsHistory$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MaintenanceActions.deleteLyricsHistory),
      concatMap(({ id }) =>
        this.lyricsService.deleteLyricsHistory(id).pipe(
          map(() => MaintenanceActions.deleteLyricsHistorySuccess({ id })),
          catchError((error) => {
            this.notificationService.showError(this.errorService.getError(error), 'Delete Lyrics History Error');
            return of(MaintenanceActions.deleteLyricsHistoryError({ id, error }));
          })
        )
      )
    );
  });

  stopLyricsHistoryCheck$ = createEffect(
    () => {
      return this.actions$.pipe(ofType(MaintenanceActions.stopLyricsHistoryCheck), concatMapTo(this.lyricsService.cancelHistoryCheck()));
    },
    { dispatch: false }
  );

  getUrlMatcher$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MaintenanceActions.getUrlMatcher),
      concatMap(() => this.urlService.list()),
      map((albums) => MaintenanceActions.getUrlMatcherSuccess({ albums })),
      catchError((error) => of(MaintenanceActions.getUrlMatcherError({ error: this.errorService.getError(error) })))
    );
  });

  startUrlMatcher$ = createEffect(
    () => {
      return this.actions$.pipe(ofType(MaintenanceActions.startUrlMatcher), concatMapTo(this.urlService.match()));
    },
    { dispatch: false }
  );

  stopUrlMatcher$ = createEffect(
    () => {
      return this.actions$.pipe(ofType(MaintenanceActions.stopUrlMatcher), concatMapTo(this.urlService.cancel()));
    },
    { dispatch: false }
  );

  constructor(
    private actions$: Actions,
    private lyricsService: LyricsMaintenanceService,
    private urlService: UrlMaintenanceService,
    private errorService: ErrorService,
    private notificationService: NotificationService
  ) {}
}
