import { Inject, Injectable } from '@angular/core';
import { BASE_PATH } from '@metal-p3/album/domain';
import { CoverService } from '@metal-p3/cover/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { EMPTY, of } from 'rxjs';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { clearCovers, downloadCover, downloadCoverSuccess, getCover, getCoverError, getCoverSuccess, saveCover, saveCoverSuccess } from './actions';
import { selectBlobCovers } from './selectors';

@Injectable()
export class CoverEffects {
  getCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getCover),
      mergeMap(({ id, folder }) =>
        this.service.getCover(`${this.basePath}/${folder}`).pipe(
          map((cover) => getCoverSuccess({ update: { id, changes: { cover, coverLoading: false, coverError: undefined } } })),
          catchError((error) => of(getCoverError({ update: { id, changes: { coverLoading: false, coverError: this.errorService.getError(error) } } })))
        )
      )
    )
  );

  downloadCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(downloadCover),
      mergeMap(({ id, url }) =>
        this.service.downloadCover(url).pipe(
          map((cover) => downloadCoverSuccess({ update: { id, changes: { cover } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  clearCovers$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearCovers),
        concatLatestFrom(() => this.store.pipe(select(selectBlobCovers))),
        filter(([_, covers]) => covers.length > 0),
        tap(([_, covers]) =>
          covers.forEach((cover) => {
            typeof cover === 'string' ? URL.revokeObjectURL(cover) : '';
          })
        )
      ),
    { dispatch: false }
  );

  saveCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveCover),
      mergeMap(({ id, folder, cover }) =>
        this.service.saveCover(folder, cover).pipe(
          map(() => saveCoverSuccess({ update: { id, changes: { savingCover: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private service: CoverService,
    private store: Store,
    private errorService: ErrorService,
    @Inject(WINDOW) readonly windowRef: Window,
    @Inject(BASE_PATH) private readonly basePath: string
  ) {}
}
