import { inject, Injectable } from '@angular/core';
import { BandService } from '@metal-p3/band/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, EMPTY, map, mergeMap, of } from 'rxjs';
import { BandActions } from './actions';

@Injectable()
export class BandEffects {
  private readonly actions$ = inject(Actions);
  private readonly service = inject(BandService);
  private readonly notificationService = inject(NotificationService);
  private readonly errorService = inject(ErrorService);

  saveBand$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BandActions.save),
      mergeMap(({ band }) =>
        this.service.saveBand(band).pipe(
          map((band) => BandActions.saveSuccess({ update: band })),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Save Band');
            return EMPTY;
          }),
        ),
      ),
    );
  });

  deleteIfOrphaned$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BandActions.deleteIfOrphaned),
      mergeMap(({ id }) =>
        this.service.deleteIfOrphaned(id).pipe(
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Delete Band');
            return EMPTY;
          }),
        ),
      ),
    );
  }, { dispatch: false });

  getBandProps$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BandActions.getProps),
      mergeMap(({ id, url }) =>
        this.service.getBandProps(url).pipe(
          map((band) => BandActions.getPropsSuccess({ update: { id, changes: { bandProps: band, gettingBandProps: false } } })),
          catchError((error) => {
            this.notificationService.showError(`${this.errorService.getError(error)}`, 'Get Band Props');
            return of(BandActions.getPropsError({ id }));
          }),
        ),
      ),
    );
  });
}
