import { Injectable } from '@angular/core';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { LyricsMaintenanceService } from '../lyrics.service';
import { addLyricsPriority } from './actions';

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

  constructor(private actions$: Actions, private lyricsService: LyricsMaintenanceService, private errorService: ErrorService, private notificationService: NotificationService) {}
}
