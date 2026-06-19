import { computed, inject } from '@angular/core';
import { PlayerActions, PlayerService, selectItemById, selectPlaylist } from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { playlistItemToDto } from '@metal-p3/player/util';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { TrackService } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
import { Actions, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Store as NgrxStore } from '@ngrx/store';
import { catchError, concatMap, EMPTY, filter, forkJoin, map, Observable, of, pipe, take, tap, withLatestFrom } from 'rxjs';
import { PlaylistService } from './playlist.service';

export interface PlaylistState {
  loaded: boolean;
  loading: boolean;
  loadError: string | undefined;
  active: number | undefined;
  transferring: boolean;
}

const initialState: PlaylistState = {
  loaded: false,
  loading: false,
  loadError: undefined,
  active: undefined,
  transferring: false,
};

export const PlaylistStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<PlaylistDto>(),
  withComputed((store) => ({
    activePlaylist: computed(() => {
      const id = store.active();
      return id ? store.entityMap()[id] : undefined;
    }),
  })),
  withMethods((store) => ({
    clearActive() {
      patchState(store, { active: undefined });
    },
    addPlaylist(playlist: PlaylistDto) {
      patchState(store, { active: playlist.id }, addEntity(playlist));
    }
  })),
  withMethods(
    (
      store,
      playlistService = inject(PlaylistService),
      trackService = inject(TrackService),
      playerService = inject(PlayerService),
      errorService = inject(ErrorService),
      notificationService = inject(NotificationService),
      ngrxStore = inject(NgrxStore),
      actions$ = inject(Actions),
    ) => ({
      loadPlaylists: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          concatMap(() =>
            playlistService.getPlaylists().pipe(
              tap((playlists) => patchState(store, { loading: false, loaded: true }, setAllEntities(playlists))),
              catchError((error) => {
                patchState(store, { loading: false, loaded: false, loadError: errorService.getError(error) });
                return EMPTY;
              })
            )
          )
        )
      ),
      loadPlaylist: rxMethod<number>(
        pipe(
          tap((id) => {
            const playlist = store.entityMap()[id];
            const tracks: Observable<Track>[] = [];

            playlist?.items.forEach((item) =>
              tracks.push(
                trackService.getTrack(item.itemPath).pipe(
                  map((track) => ({ ...track, playlistItemId: item.id })),
                  catchError((error) => {
                    notificationService.showError(`Failed to load track details for ${item.itemPath}`);
                    return EMPTY;
                  })
                )
              )
            );

            playerService.playPlaylist(tracks);
            patchState(store, { active: id });
          })
        )
      ),
      create: rxMethod<string>(
        pipe(
          withLatestFrom(ngrxStore.select(selectPlaylist)),
          map(([name, items]) => {
            const playlist: PlaylistDto = {
              id: -1,
              name,
              items: items.map((i, index) => ({ id: -1, playlistId: -1, itemPath: i.fullPath || '', itemIndex: index })),
            };
            return playlist;
          }),
          concatMap((playlist) =>
            playlistService.createPlaylist(playlist).pipe(
              tap((newPlaylist) => {
                store.addPlaylist(newPlaylist);
              }),
              catchError((error) => {
                notificationService.showError(errorService.getError(error), 'Create Playlist');
                return EMPTY;
              })
            )
          )
        )
      ),
      save: rxMethod<string>(
        pipe(
          withLatestFrom(ngrxStore.select(selectPlaylist)),
          map(([name, items]) => {
            const id = store.active();
            if (!id) throw new Error('No active playlist to save');
            return {
              id,
              name,
              items: items.map((item) => playlistItemToDto(item, id)),
            };
          }),
          concatMap((playlist: PlaylistDto) =>
            playlistService.updatePlaylist(playlist).pipe(
              withLatestFrom(ngrxStore.select(selectPlaylist)),
              tap(([updatedPlaylist, items]) => {
                patchState(store, updateEntity({ id: updatedPlaylist.id, changes: updatedPlaylist }));

                // Handle saveSuccess$ effect
                const newItems = items.filter((item) => (item.playlistItemId ?? -1) < 0);
                if (newItems.length > 0) {
                  const updateItems: Update<PlaylistItem>[] = [];
                  newItems.forEach((newItem) => {
                    const playlistItem = updatedPlaylist.items.find((i) => i.itemIndex === newItem.index);
                    if (playlistItem) {
                      updateItems.push({ id: newItem.id, changes: { playlistItemId: playlistItem.id } });
                    }
                  });
                  if (updateItems.length > 0) {
                    ngrxStore.dispatch(PlayerActions.updateItems({ updates: updateItems }));
                  }
                }
              }),
              catchError((error) => {
                notificationService.showError(errorService.getError(error), 'Save Playlist');
                return EMPTY;
              })
            )
          )
        )
      ),
      delete: rxMethod<void>(
        pipe(
          concatMap(() => {
            const id = store.active();
            if (!id) return EMPTY;
            
            return playlistService.deletePlaylist(id).pipe(
              tap(() => {
                patchState(store, { active: undefined }, removeEntity(id));
              }),
              catchError((error) => {
                notificationService.showError(errorService.getError(error), 'Delete Playlist');
                return EMPTY;
              })
            );
          })
        )
      ),
      transfer: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { transferring: true })),
          withLatestFrom(ngrxStore.select(selectPlaylist)),
          concatMap(([_, tracks]) => {
            const activePlaylist = store.activePlaylist();
            const tracks$ = tracks.map((track) => trackService.transferTrack(track.fullPath));

            return forkJoin(tracks$).pipe(
              concatMap(() => {
                if (!activePlaylist?.name) {
                  patchState(store, { transferring: false });
                  notificationService.showComplete('Playlist transferred');
                  return EMPTY;
                }

                return trackService.transferPlaylist({
                    name: activePlaylist.name,
                    playlistId: activePlaylist.id,
                    tracks: tracks.map((track, index) => ({ fullPath: track.fullPath || '', index })),
                  }).pipe(
                    tap(() => {
                      patchState(store, { transferring: false });
                      notificationService.showComplete('Playlist transferred');
                    }),
                    catchError((error) => {
                      patchState(store, { transferring: false });
                      notificationService.showError(errorService.getError(error), 'Transfer Playlist');
                      return EMPTY;
                    })
                  );
              }),
              catchError((error) => {
                patchState(store, { transferring: false });
                notificationService.showError(errorService.getError(error), 'Transfer Playlist');
                return EMPTY;
              })
            );
          })
        )
      ),
    })
  ),
  withHooks({
    onInit(store) {
      const actions$ = inject(Actions);
      const ngrxStore = inject(NgrxStore);
      const playlistService = inject(PlaylistService);

      // Listen for PlayerActions.remove to remove items from the backend playlist
      actions$.pipe(
        ofType(PlayerActions.remove),
        concatMap(({ id }) => 
          ngrxStore.select(selectItemById(id)).pipe(
            take(1),
            map(item => item!),
            filter(item => !!item?.playlistItemId),
            concatMap((item) => playlistService.removeItem(item.playlistItemId || 0))
          )
        )
      ).subscribe();
      
      // Listen for PlayerActions.clear
      actions$.pipe(
        ofType(PlayerActions.clear),
        tap(() => store.clearActive())
      ).subscribe();
    }
  })
);
