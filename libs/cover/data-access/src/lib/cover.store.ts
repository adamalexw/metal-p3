import { inject } from '@angular/core';
import { BASE_PATH, CoverRequest } from '@metal-p3/album/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import { addEntities, addEntity, removeAllEntities, updateEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concat, forkJoin, map, mergeMap, Observable, of, pipe, switchMap, tap } from 'rxjs';
import { CoverService } from './cover.service';

export interface CoverState {
  id: string | number;
  cover?: string;
  loading: boolean;
  saving: boolean;
  error?: string;
}

export const CoverStore = signalStore(
  { providedIn: 'root' },
  withEntities<CoverState>(),
  withMethods(
    (
      store,
      service = inject(CoverService),
      errorService = inject(ErrorService),
      basePath = inject(BASE_PATH)
    ) => {
      const clearAll = () => {
        store.entities().forEach((state) => {
          if (typeof state.cover === 'string' && state.cover.startsWith('blob:')) {
            URL.revokeObjectURL(state.cover);
          }
        });
        patchState(store, removeAllEntities());
      };

      return {
        clearAll,
        getCover: rxMethod<{ id: number; folder: string }>(
          pipe(
            tap(({ id }) => patchState(store, updateEntity({ id, changes: { loading: true } as Partial<CoverState> }))),
            mergeMap(({ id, folder }) =>
              service.getCover(`${basePath}/${folder}`).pipe(
                map((cover) => {
                  patchState(store, updateEntity({ id, changes: { cover, loading: false, error: undefined } as Partial<CoverState> }));
                }),
                catchError((error) => {
                  patchState(store, updateEntity({ id, changes: { loading: false, error: errorService.getError(error) } as Partial<CoverState> }));
                  return of();
                })
              )
            )
          )
        ),

        getMany: rxMethod<{ requests: CoverRequest[]; cancel?: boolean }>(
          pipe(
            switchMap(({ requests, cancel }) => {
              if (cancel) {
                clearAll();
                return of();
              }

              patchState(store, addEntities(requests.map(r => ({ id: r.id, loading: true, saving: false } as CoverState))));

              const batchSize = 12;
              const batches: CoverRequest[][] = [];

              for (let i = 0; i < requests.length; i += batchSize) {
                batches.push(requests.slice(i, i + batchSize));
              }

              return concat(
                ...batches.map((batch) => {
                  const sources: Record<number, Observable<{ cover: string; error: string | undefined }>> = {};

                  batch.forEach(
                    ({ id, folder }) =>
                      (sources[id] = service.getCover(`${basePath}/${folder}`).pipe(
                        map((cover) => ({ cover, error: undefined })),
                        catchError((error) => of({ cover: '/assets/blank.png', error: errorService.getError(error) }))
                      ))
                  );

                  return forkJoin(sources).pipe(
                    tap((covers) => {
                      const updates = Object.entries(covers).map(([id, value]) =>
                        updateEntity<CoverState>({ id: +id, changes: { loading: false, cover: value.cover, error: value.error } })
                      );
                      patchState(store, ...updates);
                    })
                  );
                })
              );
            })
          )
        ),

        downloadCover: rxMethod<{ id: number; url: string }>(
          pipe(
            tap(({ id }) => patchState(store, updateEntity({ id, changes: { loading: true } as Partial<CoverState> }))),
            mergeMap(({ id, url }) =>
              service.downloadCover(url).pipe(
                map((cover) => {
                  patchState(store, updateEntity({ id, changes: { cover, loading: false, error: undefined } as Partial<CoverState> }));
                }),
                catchError((error) => {
                  patchState(store, updateEntity({ id, changes: { loading: false, error: errorService.getError(error) } as Partial<CoverState> }));
                  return of();
                })
              )
            )
          )
        ),

        saveCover: rxMethod<{ id: number; folder: string; cover: string }>(
          pipe(
            tap(({ id }) => patchState(store, updateEntity({ id, changes: { saving: true } as Partial<CoverState> }))),
            mergeMap(({ id, folder, cover }) =>
              service.saveCover(folder, cover).pipe(
                map(() => {
                  patchState(store, updateEntity({ id, changes: { saving: false } as Partial<CoverState> }));
                }),
                catchError((error) => {
                  patchState(store, updateEntity({ id, changes: { saving: false, error: errorService.getError(error) } as Partial<CoverState> }));
                  return of();
                })
              )
            )
          )
        ),
      };
    }
  )
);
