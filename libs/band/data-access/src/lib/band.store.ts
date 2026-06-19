import { inject } from '@angular/core';
import { BandDto, BandProps } from '@metal-p3/api-interfaces';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { patchState, signalStore, withMethods } from '@ngrx/signals';
import { addEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, mergeMap, of, pipe, tap } from 'rxjs';
import { BandService } from './band.service';

export interface BandState {
  id: number; // albumId
  props?: BandProps;
  loading: boolean;
  error?: string;
}

export const BandStore = signalStore(
  { providedIn: 'root' },
  withEntities<BandState>(),
  withMethods(
    (
      store,
      service = inject(BandService),
      errorService = inject(ErrorService),
      notificationService = inject(NotificationService)
    ) => ({
      saveBand: rxMethod<BandDto>(
        pipe(
          mergeMap((band) =>
            service.saveBand(band).pipe(
              map(() => {
                // Not stored globally since albums fetch band props individually,
                // but we could track successful saves if needed.
              }),
              catchError((error) => {
                notificationService.showError(`${errorService.getError(error)}`, 'Save Band');
                return of();
              })
            )
          )
        )
      ),

      deleteIfOrphaned: rxMethod<number>(
        pipe(
          mergeMap((id) =>
            service.deleteIfOrphaned(id).pipe(
              catchError((error) => {
                notificationService.showError(`${errorService.getError(error)}`, 'Delete Band');
                return of();
              })
            )
          )
        )
      ),

      getProps: rxMethod<{ id: number; url: string }>(
        pipe(
          tap(({ id }) => {
            if (!store.entityMap()[id]) {
              patchState(store, addEntity({ id, loading: true } as BandState));
            } else {
              patchState(store, updateEntity({ id, changes: { loading: true } as Partial<BandState> }));
            }
          }),
          mergeMap(({ id, url }) =>
            service.getBandProps(url).pipe(
              map((band) => {
                patchState(store, updateEntity({ id, changes: { props: band, loading: false, error: undefined } as Partial<BandState> }));
              }),
              catchError((error) => {
                notificationService.showError(`${errorService.getError(error)}`, 'Get Band Props');
                patchState(store, updateEntity({ id, changes: { loading: false, error: errorService.getError(error) } as Partial<BandState> }));
                return of();
              })
            )
          )
        )
      ),

      initProps(id: number) {
        if (!store.entityMap()[id]) {
          patchState(store, addEntity({ id, loading: false } as BandState));
        }
      }
    })
  )
);
