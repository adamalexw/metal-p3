import { inject } from '@angular/core';
import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { patchState, signalStore, withMethods, withState, type } from '@ngrx/signals';
import { removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, EMPTY, pipe, tap } from 'rxjs';
import { LyricsMaintenanceService } from './lyrics.service';
import { UrlMaintenanceService } from './url.service';

export const MaintenanceStore = signalStore(
  { providedIn: 'root' },
  withState({
    gettingLyrics: false,
    checkingLyrics: false,
    gettingMetalArchivesMatcher: false,
    metalArchivesMatcherLoaded: false,
  }),
  withEntities({ entity: type<LyricsHistoryDto>(), collection: 'lyrics' }),
  withEntities({ entity: type<UrlMatcher>(), collection: 'metalArchivesMatcher' }),
  withMethods(
    (
      store,
      lyricsService = inject(LyricsMaintenanceService),
      urlService = inject(UrlMaintenanceService),
      errorService = inject(ErrorService),
      notificationService = inject(NotificationService),
    ) => ({
      addLyricsPriority: rxMethod<number>(
        pipe(
          concatMap((albumId) => lyricsService.addPriority(albumId)),
          tap(() => notificationService.showComplete('Lyrics Priority Added')),
          catchError((error) => {
            notificationService.showError(errorService.getError(error), 'Lyrics Priority Error');
            return EMPTY;
          }),
        ),
      ),
      getLyricsHistory: rxMethod<{ priority: boolean }>(
        pipe(
          tap(() => patchState(store, { gettingLyrics: true })),
          concatMap(({ priority }) =>
            (priority ? lyricsService.getPriority() : lyricsService.getHistory()).pipe(
              tap((history) =>
                patchState(
                  store,
                  { gettingLyrics: false },
                  setAllEntities(history, { collection: 'lyrics' }),
                ),
              ),
              catchError((error) => {
                patchState(store, { gettingLyrics: false });
                notificationService.showError(errorService.getError(error), 'Get Lyrics History Error');
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      checkLyricsHistory: rxMethod<{ priority: boolean }>(
        pipe(
          tap(() => patchState(store, { checkingLyrics: true })),
          concatMap(({ priority }) =>
            (priority ? lyricsService.checkPriority() : lyricsService.checkHistory()).pipe(
              tap(() => patchState(store, { checkingLyrics: false })),
              catchError((error) => {
                patchState(store, { checkingLyrics: false });
                notificationService.showError(errorService.getError(error), 'Check Lyrics History Error');
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      checkedLyricsHistory: rxMethod<{ id: number; checked: boolean }>(
        pipe(
          concatMap(({ id, checked }) =>
            lyricsService.checkedLyricsHistory(id, checked).pipe(
              tap(() =>
                patchState(
                  store,
                  updateEntity({ id, changes: { checked } }, { collection: 'lyrics' }),
                ),
              ),
              catchError((error) => {
                notificationService.showError(errorService.getError(error), 'Checked Lyrics History Error');
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      deleteLyricsHistory: rxMethod<number>(
        pipe(
          concatMap((id) =>
            lyricsService.deleteLyricsHistory(id).pipe(
              tap(() => patchState(store, removeEntity(id, { collection: 'lyrics' }))),
              catchError((error) => {
                notificationService.showError(errorService.getError(error), 'Delete Lyrics History Error');
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      deleteLyricsHistorySuccess(id: number) {
        patchState(store, removeEntity(id, { collection: 'lyrics' }));
      },
      updateLyricsHistory(update: { id: number; changes: Partial<LyricsHistoryDto> }) {
        patchState(store, updateEntity(update, { collection: 'lyrics' }));
      },
      stopLyricsHistoryCheck() {
        patchState(store, { checkingLyrics: false });
        lyricsService.cancelHistoryCheck().subscribe();
      },
      getUrlMatcher: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { gettingMetalArchivesMatcher: true })),
          concatMap(() =>
            urlService.list().pipe(
              tap((albums) =>
                patchState(
                  store,
                  { gettingMetalArchivesMatcher: false, metalArchivesMatcherLoaded: true },
                  setAllEntities(albums, { collection: 'metalArchivesMatcher' }),
                ),
              ),
              catchError((error) => {
                patchState(store, { gettingMetalArchivesMatcher: false });
                notificationService.showError(errorService.getError(error), 'Get Url Matcher Error');
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
      updateUrlMatcher(update: { id: number; changes: Partial<UrlMatcher> }) {
        patchState(store, updateEntity(update, { collection: 'metalArchivesMatcher' }));
      },
      startUrlMatcher() {
        urlService.match().subscribe();
      },
      stopUrlMatcher() {
        urlService.cancel().subscribe();
      },
    }),
  ),
);
