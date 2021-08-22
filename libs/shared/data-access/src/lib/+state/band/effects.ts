import { Injectable } from '@angular/core';
import { BandService } from '@metal-p3/band/data-access';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { EMPTY } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { getBandProps, getBandPropsSuccess, saveBand } from './actions';

@Injectable()
export class BandEffects {
  saveBand$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(saveBand),
        mergeMap(({ band }) =>
          this.service.saveBand(band).pipe(
            catchError((error) => {
              console.error(error);
              return EMPTY;
            })
          )
        )
      ),
    { dispatch: false }
  );

  getBandProps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getBandProps),
      mergeMap(({ id, url }) =>
        this.service.getBandProps(url).pipe(
          map((band) => getBandPropsSuccess({ update: { id, changes: { bandProps: band, gettingBandProps: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  constructor(private actions$: Actions, private service: BandService) {}
}
