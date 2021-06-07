import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { addTracksToPlaylist, noopPlaylist, pauseItem, playItem, playNext, playPrevious, updatePlaylist, updatePlaylistItem } from './actions';
import { selectActiveItemIndex, selectActivePlaylistItem, selectPlaylist } from './selectors';

@Injectable()
export class PlayerEffects {
  playItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(playItem),
      withLatestFrom(this.store.pipe(select(selectPlaylist))),
      map(([{ id }, playlistItems]) => playlistItems.map((item) => ({ id: item.id, changes: { playing: item.id === id, paused: false } }))),
      map((updates) => updatePlaylist({ updates }))
    )
  );

  pauseItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(pauseItem),
      withLatestFrom(this.store.pipe(select(selectActivePlaylistItem))),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map(([_, item]) => updatePlaylistItem({ update: { id: item?.id || '', changes: { playing: false, paused: true } } }))
    )
  );

  playPrevious$ = createEffect(() =>
    this.actions$.pipe(
      ofType(playPrevious),
      withLatestFrom(this.store.pipe(select(selectPlaylist)), this.store.pipe(select(selectActiveItemIndex))),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map(([_, playlist, index]) => {
        const id = playlist[index - 1].id;
        return playItem({ id });
      })
    )
  );

  playNext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(playNext),
      withLatestFrom(this.store.pipe(select(selectPlaylist)), this.store.pipe(select(selectActiveItemIndex))),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map(([_, playlist, index]) => {
        const id = playlist[index + 1].id;
        return playItem({ id });
      })
    )
  );

  addToPlaylist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(addTracksToPlaylist),
      withLatestFrom(this.store.pipe(select(selectActivePlaylistItem))),
      tap(([{ tracks }, item]) => console.log(tracks, item)),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map(([{ tracks }, item]) => (item?.playing || item?.paused ? noopPlaylist() : playItem({ id: tracks[0]?.id })))
    )
  );

  constructor(private actions$: Actions, private store: Store) {}
}
