import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { playTrack, updatePlaylist } from './actions';
import { selectPlaylist } from './selectors';

@Injectable()
export class PlayerEffects {
  playTrack$ = createEffect(() =>
    this.actions$.pipe(
      ofType(playTrack),
      concatLatestFrom(() => this.store.pipe(select(selectPlaylist))),
      map(([{ id }, playlistItems]) => playlistItems.map((item) => ({ id: item.id, changes: { playing: item.id === id } }))),
      map((updates) => updatePlaylist({ updates }))
    )
  );

  constructor(private actions$: Actions, private store: Store) {}
}
