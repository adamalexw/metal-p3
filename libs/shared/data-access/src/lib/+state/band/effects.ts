import { inject, Injectable } from '@angular/core';
import { BandService } from '@metal-p3/band/data-access';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { BandActions } from './actions';

@Injectable()
export class BandEffects {
  private readonly actions$ = inject(Actions);
  private readonly service = inject(BandService);

  saveBand$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BandActions.save),
      mergeMap(({ band }) =>
        this.service.saveBand(band).pipe(
          map((band) => BandActions.saveSuccess({ update: band })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          }),
        ),
      ),
    );
  });

  getBandProps$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(BandActions.getProps),
      mergeMap(({ id, url }) =>
        this.service.getBandProps(url).pipe(
          map((band) => BandActions.getPropsSuccess({ update: { id, changes: { bandProps: band, gettingBandProps: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          }),
        ),
      ),
    );
  });
}
