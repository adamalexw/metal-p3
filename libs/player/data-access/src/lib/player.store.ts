import { computed, inject } from '@angular/core';
import { CoverService } from '@metal-p3/cover/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { shuffleArray } from '@metal-p3/player/util';
import { ErrorService } from '@metal-p3/shared/error';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntities, addEntity, removeAllEntities, removeEntity, updateAllEntities, updateEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, mergeMap, pipe, tap } from 'rxjs';

export interface PlayerState {
  visible: boolean;
  footerMode: boolean;
  showPlaylist: boolean;
  activeTrack: string | undefined;
}

const initialState: PlayerState = {
  visible: false,
  footerMode: true,
  showPlaylist: true,
  activeTrack: undefined,
};

export const PlayerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<PlaylistItem>(),
  withComputed((store) => ({
    playlist: computed(() => [...store.entities()].sort((a, b) => a.index - b.index)),
    playlistSize: computed(() => store.entities().length),
    showPlayer: computed(() => store.entities().length > 0),
    playerOpen: computed(() => store.entities().length > 0 || store.visible()),
    activePlaylistItem: computed(() => {
      const id = store.activeTrack();
      return id ? store.entityMap()[id] : undefined;
    }),
    activeItemCover: computed(() => {
      const id = store.activeTrack();
      const item = id ? store.entityMap()[id] : undefined;
      return item?.cover ?? '/assets/blank.png';
    }),
    activeItemIndex: computed(() => {
      const id = store.activeTrack();
      const pl = [...store.entities()].sort((a, b) => a.index - b.index);
      return pl.findIndex((item) => item.id === id);
    }),
    playlistDuration: computed(() => store.entities().reduce((acc, curr) => acc + (curr.duration || 0), 0)),
  })),
  withComputed((store) => ({
    isFirstItemPlaying: computed(() => store.activeItemIndex() === 0),
    isLastItemPlaying: computed(() => store.activeItemIndex() === store.playlistSize() - 1),
  })),
  withMethods((store) => ({
    getCoverSuccess(payload: { id: string; cover: string }) {
      patchState(store, updateEntity({ id: payload.id, changes: { cover: payload.cover } as Partial<PlaylistItem> }));
      const source = store.entityMap()[payload.id];
      if (!source?.folder || !payload.cover) return;

      const others = store.entities().filter(i => i.id !== payload.id && i.folder === source.folder && !i.cover);
      if (others.length) {
        const updaters = others.map(i => updateEntity<PlaylistItem>({ id: i.id, changes: { cover: payload.cover } }));
        patchState(store, ...updaters);
      }
    }
  })),
  withMethods((store, coverService = inject(CoverService), errorService = inject(ErrorService)) => ({
    show() {
      patchState(store, { visible: true, footerMode: false });
    },
    close() {
      patchState(store, { visible: false }, removeAllEntities());
    },
    toggleView() {
      patchState(store, { footerMode: !store.footerMode() });
    },
    togglePlaylist() {
      patchState(store, { showPlaylist: !store.showPlaylist() });
    },
    updateItem(update: { id: string; changes: Partial<PlaylistItem> }) {
      patchState(store, updateEntity(update));
    },
    updateItems(updates: { id: string; changes: Partial<PlaylistItem> }[]) {
      const updaters = updates.map(u => updateEntity<PlaylistItem>(u));
      patchState(store, ...updaters);
    },
    play(id: string) {
      patchState(
        store,
        { activeTrack: id },
        updateAllEntities((item) => ({ ...item, playing: item.id === id, paused: false }))
      );
    },
    pause() {
      const active = store.activePlaylistItem();
      if (active) {
        patchState(store, updateEntity({ id: active.id, changes: { playing: false, paused: true } }));
      }
    },
    playPrevious() {
      const index = store.activeItemIndex();
      const pl = store.playlist();
      if (index > 0 && pl[index - 1]) {
        this.play(pl[index - 1].id);
      }
    },
    playNext() {
      const index = store.activeItemIndex();
      const pl = store.playlist();
      if (index >= 0 && index < pl.length - 1 && pl[index + 1]) {
        this.play(pl[index + 1].id);
      }
    },
    addItem(track: PlaylistItem) {
      patchState(store, addEntity(track));
      this.getCover({ id: track.id, folder: track.folder || '' });
    },
    addItems(tracks: PlaylistItem[]) {
      patchState(store, addEntities(tracks));
      
      const active = store.activePlaylistItem();
      if (!active?.playing && !active?.paused && tracks[0]) {
        this.play(tracks[0].id);
      }
      
      const seenFolders = new Set<string>();
      tracks.forEach((track) => {
        const key = track.folder || track.id;
        if (!seenFolders.has(key)) {
          seenFolders.add(key);
          this.getCover({ id: track.id, folder: track.folder || '' });
        }
      });
    },
    remove(id: string) {
      const item = store.entityMap()[id];
      if (item) {
        if (typeof item.cover === 'string') URL.revokeObjectURL(item.cover);
        if (typeof item.url === 'string') URL.revokeObjectURL(item.url);
      }
      patchState(store, removeEntity(id));
    },
    clear() {
      store.entities().forEach(blob => {
        if (typeof blob.cover === 'string') URL.revokeObjectURL(blob.cover);
        if (typeof blob.url === 'string') URL.revokeObjectURL(blob.url);
      });
      patchState(store, { activeTrack: undefined }, removeAllEntities());
    },
    shuffle() {
      const pl = [...store.playlist()];
      shuffleArray(pl);
      const updaters = pl.map((item, index) => updateEntity<PlaylistItem>({ id: item.id, changes: { index } }));
      patchState(
        store,
        ...updaters
      );
    },
    getCover: rxMethod<{ id: string; folder: string }>(
      pipe(
        mergeMap(({ id, folder }) => {
          const existingCover = store.playlist().find(item => item.folder === folder && typeof item.cover === 'string' && item.cover.startsWith('blob:'))?.cover ?? null;
          
          if (existingCover) {
            store.getCoverSuccess({ id, cover: existingCover });
            return EMPTY;
          }

          return coverService.getCover(folder).pipe(
            tap((cover) => store.getCoverSuccess({ id, cover })),
            catchError((error) => {
              patchState(store, updateEntity({ id, changes: { cover: errorService.getError(error) } }));
              return EMPTY;
            })
          );
        })
      )
    ),
  }))
);
