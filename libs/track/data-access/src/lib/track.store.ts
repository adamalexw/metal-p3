import { computed, effect, inject } from '@angular/core';
import { AlbumStore } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { ErrorService } from '@metal-p3/shared/error';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Track } from '@metal-p3/track/domain';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState, type } from '@ngrx/signals';
import { removeAllEntities, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, concatMap, EMPTY, filter, map, mergeMap, of, pipe, switchMap, tap, timeout } from 'rxjs';
import { TrackService } from './track.service';

export interface TrackState {
  loading: boolean;
  error?: string;
  gettingMaTracks: boolean;
  maTracksError?: string;
  savingTrackId?: number;
  transferringTrackId?: number;
}

export const TrackStore = signalStore(
  { providedIn: 'root' },
  withState<TrackState>({
    loading: false,
    error: undefined,
    gettingMaTracks: false,
    maTracksError: undefined,
  }),
  withEntities<Track>(),
  withEntities({ entity: type<MetalArchivesAlbumTrack>(), collection: 'maTracks' }),
  withComputed((store) => ({
    tracks: computed(() => store.entities()),
    maTracks: computed(() => store.maTracksEntities()),
    tracksDuration: computed(() => store.entities().reduce((total, track) => total + (track.duration || 0), 0)),
  })),
  withMethods(
    (
      store,
      service = inject(TrackService),
      errorService = inject(ErrorService),
      notificationService = inject(NotificationService),
      basePath = inject(BASE_PATH)
    ) => ({
      getTracks: rxMethod<{ id: number; folder: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: undefined }, removeAllEntities())),
          switchMap(({ folder }) =>
            service.getTracks(`${basePath}/${folder}`).pipe(
              map((tracks) => patchState(store, { loading: false }, setAllEntities(tracks))),
              catchError((error) => {
                patchState(store, { loading: false, error: errorService.getError(error) }, removeAllEntities());
                return of();
              })
            )
          )
        )
      ),

      saveTrack: rxMethod<{ track: Track }>(
        pipe(
          tap(({ track }) => patchState(store, updateEntity({ id: track.id, changes: { trackSaving: true, trackSavingError: undefined } }))),
          concatMap(({ track }) =>
            service.saveTrack(track).pipe(
              map(() => patchState(store, updateEntity({ id: track.id, changes: { ...track, trackSaving: false } }))),
              catchError((error) => {
                patchState(store, updateEntity({ id: track.id, changes: { trackSaving: false, trackSavingError: errorService.getError(error) } }))
                return of();
              })
            )
          )
        )
      ),

      saveTracks: rxMethod<{ tracks: Track[] }>(
        pipe(
          tap(({ tracks }) => {
            const updates = tracks.map((track) => ({ id: track.id, changes: { trackSaving: true, trackSavingError: undefined } }));
            updates.forEach((update) => patchState(store, updateEntity(update)));
          }),
          mergeMap(({ tracks }) =>
            service.saveTracks(tracks).pipe(
              map(() => {
                const updates = tracks.map((track) => ({ id: track.id, changes: { ...track, trackSaving: false } }));
                updates.forEach((update) => patchState(store, updateEntity(update)));
                notificationService.showComplete('Tracks saved');
              }),
              catchError((error) => {
                const updates = tracks.map((track) => ({ id: track.id, changes: { trackSaving: false, trackSavingError: errorService.getError(error) } }));
                updates.forEach((update) => patchState(store, updateEntity(update)));
                notificationService.showError(`${errorService.getError(error)}`, 'Save Tracks');
                return of();
              })
            )
          )
        )
      ),

      getMetalArchivesTracks: rxMethod<{ url: string }>(
        pipe(
          tap(() => patchState(store, { gettingMaTracks: true, maTracksError: undefined }, removeAllEntities({ collection: 'maTracks' }))),
          mergeMap(({ url }) =>
            service.getMaTracks(url).pipe(
              map((maTracks) => {
                patchState(store, { gettingMaTracks: false }, setAllEntities(maTracks, { collection: 'maTracks' }));
              }),
              catchError((error) => {
                patchState(store, { gettingMaTracks: false, maTracksError: errorService.getError(error) });
                return of();
              })
            )
          )
        )
      ),

      getLyrics: rxMethod<{ trackId: string }>(
        pipe(
          tap(({ trackId }) => patchState(store, updateEntity({ id: trackId, changes: { lyricsLoading: true } }, { collection: 'maTracks' }))),
          mergeMap(({ trackId }) =>
            service.getLyrics(trackId).pipe(
              timeout(60_000),
              map((lyrics) => patchState(store, updateEntity({ id: trackId, changes: { lyricsLoading: false, lyrics: lyrics || undefined, lyricsChecked: true } }, { collection: 'maTracks' }))),
              catchError((error) => {
                patchState(store, updateEntity({ id: trackId, changes: { lyricsLoading: false, lyricsChecked: true } }, { collection: 'maTracks' }));
                return of();
              })
            )
          )
        )
      ),

      renameTrack: rxMethod<{ track: Track }>(
        pipe(
          tap(({ track }) => patchState(store, updateEntity({ id: track.id, changes: { trackRenaming: true, trackRenamingError: undefined } }))),
          mergeMap(({ track }) =>
            service.renameTrack(track).pipe(
              map(({ fullPath, file }) => patchState(store, updateEntity({ id: track.id, changes: { trackRenaming: false, fullPath, file } }))),
              catchError((error) => {
                patchState(store, updateEntity({ id: track.id, changes: { trackRenaming: false, trackRenamingError: errorService.getError(error) } }));
                return of();
              })
            )
          )
        )
      ),

      transferTrack: rxMethod<{ trackId: number }>(
        pipe(
          tap(({ trackId }) => patchState(store, updateEntity({ id: trackId, changes: { trackTransferring: true } }))),
          mergeMap(({ trackId }) => {
            const track = store.entityMap()[trackId];
            if (!track) return EMPTY;
            return service.transferTrack(track.fullPath).pipe(
              map(() => patchState(store, updateEntity({ id: trackId, changes: { trackTransferring: false } }))),
              catchError((error) => {
                patchState(store, updateEntity({ id: trackId, changes: { trackTransferring: false } }));
                notificationService.showError(`${errorService.getError(error)}`, 'Transfer Track');
                return of();
              })
            );
          })
        )
      ),

      deleteTrack: rxMethod<{ track: Track }>(
        pipe(
          tap(({ track }) => patchState(store, updateEntity({ id: track.id, changes: { trackDeleting: true, trackDeletionError: undefined } }))),
          mergeMap(({ track }) =>
            service.deleteTrack(track.fullPath || '').pipe(
              map(() => patchState(store, removeEntity(track.id))),
              catchError((error) => {
                patchState(store, updateEntity({ id: track.id, changes: { trackDeleting: false, trackDeletionError: errorService.getError(error) } }));
                return of();
              })
            )
          )
        )
      ),
      
      updateTrack: rxMethod<{ trackId: number; changes: Partial<Track> }>(
        pipe(tap(({ trackId, changes }) => patchState(store, updateEntity({ id: trackId, changes }))))
      ),
      
      updateTracks: rxMethod<{ updates: { id: number; changes: Partial<Track> }[] }>(
        pipe(tap(({ updates }) => updates.forEach((update) => patchState(store, updateEntity(update)))))
      ),
    })
  ),
  withMethods((store, service = inject(TrackService)) => ({
    getSyncedLyrics: rxMethod<{ localTrackId: number; maTrackId: string; artist: string; track: string; album: string; durationSeconds: number }>(
      pipe(
        tap(({ localTrackId }) => patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: true } }))),
        mergeMap(({ localTrackId, maTrackId, artist, track, album, durationSeconds }) =>
          service.getSyncedLyrics({ artist, track, album, durationSeconds }).pipe(
            timeout(20_000),
            map((result) => {
              if (result?.syncedLyrics && !result.instrumental) {
                patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: false, syncedLyrics: result.syncedLyrics || undefined, lyricsSource: 'synced', lyricsChecked: true } }));
              } else {
                patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: false } }));
                // Fallback to getLyrics
                store.getLyrics({ trackId: maTrackId });
              }
            }),
            catchError(() => {
              patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: false } }));
              store.getLyrics({ trackId: maTrackId });
              return of();
            })
          )
        )
      )
    ),

    getLocalLyrics: rxMethod<{ localTrackId: number; artist: string; track: string; album: string; durationSeconds: number }>(
      pipe(
        tap(({ localTrackId }) => patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: true } }))),
        mergeMap(({ localTrackId, artist, track, album, durationSeconds }) =>
          service.getSyncedLyrics({ artist, track, album, durationSeconds }).pipe(
            timeout(20_000),
            map((result) => {
              if (result && !result.instrumental && (result.syncedLyrics || result.plainLyrics)) {
                patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: false, syncedLyrics: result.syncedLyrics || undefined, lyrics: result.plainLyrics || undefined, lyricsSource: result.syncedLyrics ? 'synced' : 'plain', lyricsChecked: true } }));
              } else {
                patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: false, lyricsChecked: true } }));
              }
            }),
            catchError(() => {
              patchState(store, updateEntity({ id: localTrackId, changes: { lyricsLoading: false, lyricsChecked: true } }));
              return of();
            })
          )
        )
      )
    ),
  })),
  withHooks({
    onInit(store) {
      const albumStore = inject(AlbumStore);

      let previousId: number | undefined;
      let previousFolder: string | undefined;

      effect(() => {
        const album = albumStore.selectedAlbum();
        const selectedAlbumId = albumStore.selectedAlbumId?.();
        
        if (album) {
          if (previousId !== album.id || previousFolder !== album.folder) {
            previousId = album.id;
            previousFolder = album.folder;
            store.getTracks({ id: album.id, folder: album.folder });
          }
        } else if (selectedAlbumId === undefined) {
          if (previousId !== undefined) {
            previousId = undefined;
            previousFolder = undefined;
            patchState(store, removeAllEntities(), setAllEntities<MetalArchivesAlbumTrack, 'maTracks'>([], { collection: 'maTracks' }));
          }
        }
      });
    }
  })
);
