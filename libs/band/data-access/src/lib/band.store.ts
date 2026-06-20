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

export const createInitialBandState = (id: number, overrides?: Partial<BandState>): BandState => ({
  id,
  loading: false,
  ...overrides,
});

export const BandStore = signalStore(
  { providedIn: 'root' },
  withEntities<BandState>(),
  withMethods((store, service = inject(BandService), errorService = inject(ErrorService), notificationService = inject(NotificationService)) => ({
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
            }),
          ),
        ),
      ),
    ),

    deleteIfOrphaned: rxMethod<number>(
      pipe(
        mergeMap((id) =>
          service.deleteIfOrphaned(id).pipe(
            catchError((error) => {
              notificationService.showError(`${errorService.getError(error)}`, 'Delete Band');
              return of();
            }),
          ),
        ),
      ),
    ),

    getProps: rxMethod<{ id: number; url: string }>(
      pipe(
        tap(({ id }) => {
          if (!store.entityMap()[id]) {
            patchState(store, addEntity(createInitialBandState(id, { loading: true })));
          } else {
            patchState(store, updateEntity({ id, changes: { loading: true } }));
          }
        }),
        mergeMap(({ id, url }) =>
          service.getBandProps(url).pipe(
            map((band) => {
              patchState(store, updateEntity({ id, changes: { props: band, loading: false, error: undefined } }));
            }),
            catchError((error) => {
              notificationService.showError(`${errorService.getError(error)}`, 'Get Band Props');
              patchState(store, updateEntity({ id, changes: { loading: false, error: errorService.getError(error) } }));
              return of();
            }),
          ),
        ),
      ),
    ),

    initProps(id: number) {
      if (!store.entityMap()[id]) {
        patchState(store, addEntity(createInitialBandState(id, { loading: true })));
      }
    },
  })),
);
