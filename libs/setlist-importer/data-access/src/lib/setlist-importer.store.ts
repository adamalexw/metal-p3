import { inject } from '@angular/core';
import { PlaylistService, PlaylistStore } from '@metal-p3/playlist/data-access';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { ImportedSetlist, ResolvedTrack } from '@metal-p3/setlist-importer/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, EMPTY, pipe, tap } from 'rxjs';
import { SetlistImporterService } from './setlist-importer.service';

export interface SetlistImporterState {
  urls: string[];
  setlists: ImportedSetlist[];
  tracks: ResolvedTrack[];
  scraping: boolean;
  matching: boolean;
  creating: boolean;
  error: string | undefined;
}

const initialState: SetlistImporterState = {
  urls: [],
  setlists: [],
  tracks: [],
  scraping: false,
  matching: false,
  creating: false,
  error: undefined,
};

export const SetlistImporterStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store) => ({
      setUrls(urls: string[]) {
        patchState(store, { urls });
      },
      toggleTrackSelection(key: string) {
        patchState(store, (state) => ({
          tracks: state.tracks.map((t) => (t.key === key ? { ...t, selected: !t.selected } : t)),
        }));
      },
      setAllSelection(selected: boolean) {
        patchState(store, (state) => ({
          tracks: state.tracks.map((t) => (t.status === 'matched' ? { ...t, selected } : t)),
        }));
      },
      reset() {
        patchState(store, initialState);
      },
    })
  ),
  withMethods(
    (
      store,
      service = inject(SetlistImporterService),
      errorService = inject(ErrorService),
    ) => ({
      match: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { matching: true, error: undefined })),
          concatMap(() =>
            service.match(store.setlists()).pipe(
              tap((tracks) => patchState(store, { matching: false, tracks })),
              catchError((error) => {
                patchState(store, { matching: false, error: errorService.getError(error) });
                return EMPTY;
              })
            )
          )
        )
      ),
    })
  ),
  withMethods(
    (
      store,
      service = inject(SetlistImporterService),
      playlistService = inject(PlaylistService),
      errorService = inject(ErrorService),
      notificationService = inject(NotificationService),
      playlistStore = inject(PlaylistStore),
    ) => ({
      scrape: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { scraping: true, error: undefined })),
          concatMap(() =>
            service.scrape(store.urls()).pipe(
              tap((setlists) => {
                const firstError = setlists.find((s) => s.error)?.error;
                patchState(store, {
                  scraping: false,
                  setlists,
                  tracks: [],
                  error: firstError || undefined,
                });
                
                // Automatically trigger match after scrape
                if (setlists.length > 0 && !firstError) {
                  setTimeout(() => store.match());
                }
              }),
              catchError((error) => {
                const errorMessage = errorService.getError(error);
                patchState(store, { scraping: false, error: errorMessage });
                return EMPTY;
              })
            )
          )
        )
      ),
      createPlaylist: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { creating: true, error: undefined })),
          concatMap((name) => {
            const tracks = store.tracks();
            const items = tracks
              .filter((t) => t.selected && !!t.match)
              .map((t, index) => ({ id: -1, playlistId: -1, itemPath: t.match!.fullPath, itemIndex: index }));

            const dto: PlaylistDto = { id: -1, name, items };
            
            return playlistService.createPlaylist(dto).pipe(
              tap((playlist) => {
                patchState(store, { creating: false });
                notificationService.showComplete(`Playlist "${playlist.name}" created`);
                playlistStore.addPlaylist(playlist);
              }),
              catchError((error) => {
                const errorMessage = errorService.getError(error);
                patchState(store, { creating: false, error: errorMessage });
                notificationService.showError(errorMessage, 'Create Playlist');
                return EMPTY;
              })
            );
          })
        )
      ),
    })
  )
);
