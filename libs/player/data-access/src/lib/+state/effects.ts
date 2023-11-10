import { Injectable } from '@angular/core';
import { CoverService } from '@metal-p3/cover/data-access';
import { shuffleArray } from '@metal-p3/player/util';
import { ErrorService } from '@metal-p3/shared/error';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { PlayerActions } from './actions';
import { selectActiveItemIndex, selectActivePlaylistItem, selectItemById, selectPlaylist, selectPlaylistBlobs } from './selectors';

@Injectable()
export class PlayerEffects {
  play$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.play),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
      map(([{ id }, playlistItems]) => playlistItems.map((item) => ({ id: item.id, changes: { playing: item.id === id, paused: false } }))),
      map((updates) => PlayerActions.updateItems({ updates }))
    );
  });

  pause$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.pause),
      concatLatestFrom(() => this.store.select(selectActivePlaylistItem)),
      map(([_, item]) => PlayerActions.updateItem({ update: { id: item?.id || '', changes: { playing: false, paused: true } } }))
    );
  });

  playPrevious$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.playPrevious),
      concatLatestFrom(() => [this.store.select(selectPlaylist), this.store.select(selectActiveItemIndex)]),
      map(([_, playlist, index]) => {
        const id = playlist[index - 1].id;
        return PlayerActions.play({ id });
      })
    );
  });

  playNext$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.playNext),
      concatLatestFrom(() => [this.store.select(selectPlaylist), this.store.select(selectActiveItemIndex)]),
      map(([_, playlist, index]) => {
        const id = playlist[index + 1].id;
        return PlayerActions.play({ id });
      })
    );
  });

  addItem$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.addItem),
      map(({ track }) => PlayerActions.getCover({ id: track.id, folder: track.folder || '' }))
    );
  });

  addItems$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.addItems),
      concatLatestFrom(() => this.store.select(selectActivePlaylistItem)),
      map(([{ tracks }, item]) => (item?.playing || item?.paused ? PlayerActions.noop() : PlayerActions.play({ id: tracks[0]?.id })))
    );
  });

  remove$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.remove),
      concatLatestFrom(({ id }) => this.store.select(selectItemById(id))),
      tap(([_, item]) => {
        if (item) {
          typeof item.cover === 'string' ? URL.revokeObjectURL(item.cover) : '';
          typeof item.url === 'string' ? URL.revokeObjectURL(item.url) : '';
        }
      }),
      map(([{ id }, _item]) => id),
      map((id) => PlayerActions.removeSuccess({ id }))
    );
  });

  getCover$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.getCover),
      mergeMap(({ id, folder }) =>
        this.coverService.getCover(folder).pipe(
          map((cover) => PlayerActions.getCoverSuccess({ update: { id, changes: { cover } } })),
          catchError((error) => of(PlayerActions.getCoverError({ update: { id, changes: { cover: this.errorService.getError(error) } } })))
        )
      )
    );
  });

  shuffle$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.shuffle),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
      map(([_, playlist]) => {
        shuffleArray(playlist);
        return PlayerActions.shuffleSuccess({ updates: playlist.map((item, index) => ({ id: item.id, changes: { index } })) });
      })
    );
  });

  clear$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.clear),
      concatLatestFrom(() => this.store.select(selectPlaylistBlobs)),
      filter(([_, blobs]) => blobs.length > 0),
      tap(([_, blobs]) =>
        blobs.forEach((blob) => {
          typeof blob === 'string' ? URL.revokeObjectURL(blob) : '';
        })
      ),
      map(() => PlayerActions.clearSuccess())
    );
  });

  constructor(private readonly actions$: Actions, private readonly store: Store, private readonly coverService: CoverService, private readonly errorService: ErrorService) {}
}
