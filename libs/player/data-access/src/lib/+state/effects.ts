import { inject, Injectable } from '@angular/core';
import { CoverService } from '@metal-p3/cover/data-access';
import { shuffleArray } from '@metal-p3/player/util';
import { ErrorService } from '@metal-p3/shared/error';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, filter, map, mergeMap, of, tap } from 'rxjs';
import { PlayerActions } from './actions';
import { selectActiveItemIndex, selectActivePlaylistItem, selectCoverByFolder, selectItemById, selectPlaylist, selectPlaylistBlobs } from './selectors';

@Injectable()
export class PlayerEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly coverService = inject(CoverService);
  private readonly errorService = inject(ErrorService);

  play$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.play),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
      map(([{ id }, playlistItems]) => playlistItems.map((item) => ({ id: item.id, changes: { playing: item.id === id, paused: false } }))),
      map((updates) => PlayerActions.updateItems({ updates })),
    );
  });

  pause$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.pause),
      concatLatestFrom(() => this.store.select(selectActivePlaylistItem)),
      map(([_, item]) => PlayerActions.updateItem({ update: { id: item?.id || '', changes: { playing: false, paused: true } } })),
    );
  });

  playPrevious$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.playPrevious),
      concatLatestFrom(() => [this.store.select(selectPlaylist), this.store.select(selectActiveItemIndex)]),
      map(([_, playlist, index]) => {
        const id = playlist[index - 1].id;
        return PlayerActions.play({ id });
      }),
    );
  });

  playNext$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.playNext),
      concatLatestFrom(() => [this.store.select(selectPlaylist), this.store.select(selectActiveItemIndex)]),
      map(([_, playlist, index]) => {
        const id = playlist[index + 1].id;
        return PlayerActions.play({ id });
      }),
    );
  });

  addItem$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.addItem),
      map(({ track }) => PlayerActions.getCover({ id: track.id, folder: track.folder || '' })),
    );
  });

  addItems$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.addItems),
      concatLatestFrom(() => this.store.select(selectActivePlaylistItem)),
      map(([{ tracks }, item]) => (item?.playing || item?.paused ? PlayerActions.noop() : PlayerActions.play({ id: tracks[0]?.id }))),
    );
  });

  remove$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.remove),
      concatLatestFrom(({ id }) => this.store.select(selectItemById(id))),
      tap(([_, item]) => {
        if (item) {
          if (typeof item.cover === 'string') {
            URL.revokeObjectURL(item.cover);
          }
          if (typeof item.url === 'string') {
            URL.revokeObjectURL(item.url);
          }
        }
      }),
      map(([{ id }, _item]) => id),
      map((id) => PlayerActions.removeSuccess({ id })),
    );
  });

  getCover$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.getCover),
      concatLatestFrom(({ folder }) => this.store.select(selectCoverByFolder(folder))),
      mergeMap(([{ id, folder }, existingCover]) => {
        if (existingCover) {
          return of(PlayerActions.getCoverSuccess({ update: { id, changes: { cover: existingCover } } }));
        }
        return this.coverService.getCover(folder).pipe(
          map((cover) => PlayerActions.getCoverSuccess({ update: { id, changes: { cover } } })),
          catchError((error) => of(PlayerActions.getCoverError({ update: { id, changes: { cover: this.errorService.getError(error) } } }))),
        );
      }),
    );
  });

  propagateCover$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.getCoverSuccess),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
      map(([{ update }, playlist]) => {
        const source = playlist.find((i) => i.id === update.id);
        if (!source?.folder || !update.changes.cover) return PlayerActions.noop();

        const others = playlist.filter((i) => i.id !== update.id && i.folder === source.folder && !i.cover);
        if (!others.length) return PlayerActions.noop();

        return PlayerActions.updateItems({ updates: others.map((i) => ({ id: i.id, changes: { cover: update.changes.cover } })) });
      }),
    );
  });

  shuffle$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.shuffle),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
      map(([_, playlist]) => {
        shuffleArray(playlist);
        return PlayerActions.shuffleSuccess({ updates: playlist.map((item, index) => ({ id: item.id, changes: { index } })) });
      }),
    );
  });

  clear$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlayerActions.clear),
      concatLatestFrom(() => this.store.select(selectPlaylistBlobs)),
      filter(([_, blobs]) => blobs.length > 0),
      tap(([_, blobs]) =>
        blobs.forEach((blob) => {
          if (typeof blob === 'string') {
            URL.revokeObjectURL(blob);
          }
        }),
      ),
      map(() => PlayerActions.clearSuccess()),
    );
  });
}
