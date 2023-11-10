import { Inject, Injectable } from '@angular/core';
import { BASE_PATH, CoverRequest } from '@metal-p3/album/domain';
import { CoverService } from '@metal-p3/cover/data-access';
import { ErrorService } from '@metal-p3/shared/error';
import { WINDOW } from '@ng-web-apis/common';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, forkJoin, iif, of } from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { AlbumActions } from '../actions';
import { Album } from '../model';
import { CoverActions } from './actions';
import { selectBlobCovers } from './selectors';

@Injectable()
export class CoverEffects {
  getCover$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoverActions.get),
      mergeMap(({ id, folder }) =>
        this.service.getCover(`${this.basePath}/${folder}`).pipe(
          map((cover) => CoverActions.getSuccess({ update: { id, changes: { cover, coverLoading: false, coverError: undefined } } })),
          catchError((error) => of(CoverActions.getError({ update: { id, changes: { coverLoading: false, coverError: this.errorService.getError(error) } } })))
        )
      )
    );
  });

  cancelCovers$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AlbumActions.cancelPreviousSearchSuccess),
      map(() => CoverActions.cancelPreviousGetMany({ request: { requests: [], cancel: true } }))
    );
  });

  getMany$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoverActions.getMany, CoverActions.cancelPreviousGetMany),
      switchMap(({ request }) => iif(() => !!request.cancel, of(CoverActions.clearAll()), this.covers$(request.requests).pipe(map((update) => CoverActions.getManySuccess({ update })))))
    );
  });

  downloadCover$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoverActions.download),
      mergeMap(({ id, url }) =>
        this.service.downloadCover(url).pipe(
          map((cover) => CoverActions.downloadSuccess({ update: { id, changes: { cover } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    );
  });

  clearAll$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(CoverActions.clearAll, AlbumActions.cancelPreviousSearch),
        concatLatestFrom(() => this.store.select(selectBlobCovers)),
        filter(([_, covers]) => covers.length > 0),
        tap(([_, covers]) =>
          covers.forEach((cover) => {
            typeof cover === 'string' ? URL.revokeObjectURL(cover) : '';
          })
        )
      );
    },
    { dispatch: false }
  );

  saveCover$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CoverActions.save),
      mergeMap(({ id, folder, cover }) =>
        this.service.saveCover(folder, cover).pipe(
          map(() => CoverActions.saveSuccess({ update: { id, changes: { savingCover: false } } })),
          catchError((error) => {
            console.error(error);
            return EMPTY;
          })
        )
      )
    );
  });

  private covers$(requests: CoverRequest[]): Observable<Update<Album>[]> {
    const sources: Record<number, Observable<{ cover: string; coverError: string | undefined }>> = {};

    requests.map(
      ({ id, folder }) =>
        (sources[id] = this.service.getCover(`${this.basePath}/${folder}`).pipe(
          map((cover) => ({ cover, coverError: undefined })),
          catchError((error) => {
            const coverError = this.errorService.getError(error);
            return of({ cover: '/assets/blank.png', coverError });
          })
        ))
    );

    return forkJoin(sources).pipe(map((covers) => Object.entries(covers).map(([id, value]) => ({ id, changes: { coverLoading: false, cover: value.cover, coverError: value.coverError } }))));
  }

  constructor(
    private readonly actions$: Actions,
    private readonly service: CoverService,
    private readonly store: Store,
    private readonly errorService: ErrorService,
    @Inject(WINDOW) readonly windowRef: Window,
    @Inject(BASE_PATH) private readonly basePath: string
  ) {}
}
