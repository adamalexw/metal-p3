/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable } from '@angular/core';
import { BASE_PATH } from '@metal-p3/album/domain';
import { CoverService } from '@metal-p3/cover/data-access';
import { shuffleArray } from '@metal-p3/player/util';
import { ErrorService } from '@metal-p3/shared/error';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, filter, map, mergeMap, tap, withLatestFrom } from 'rxjs/operators';
import {
  addTracksToPlaylist,
  clearBlobs,
  getItemCover,
  getItemCoverError,
  getItemCoverSuccess,
  noopPlaylist,
  pauseItem,
  playItem,
  playNext,
  playPrevious,
  removeItem,
  removeItemSuccess,
  shufflePlaylist,
  shufflePlaylistSuccess,
  updatePlaylist,
  updatePlaylistItem,
} from './actions';
import { selectActiveItemIndex, selectActivePlaylistItem, selectItemById, selectPlaylist, selectPlaylistBlobs } from './selectors';

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
      map(([_, item]) => updatePlaylistItem({ update: { id: item?.id || '', changes: { playing: false, paused: true } } }))
    )
  );

  playPrevious$ = createEffect(() =>
    this.actions$.pipe(
      ofType(playPrevious),
      withLatestFrom(this.store.pipe(select(selectPlaylist)), this.store.pipe(select(selectActiveItemIndex))),
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
      map(([{ tracks }, item]) => (item?.playing || item?.paused ? noopPlaylist() : playItem({ id: tracks[0]?.id })))
    )
  );

  removeItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(removeItem),
      concatLatestFrom(({ id }) => this.store.pipe(select(selectItemById(id)))),
      tap(([{ id }, item]) => {
        if (item) {
          typeof item.cover === 'string' ? URL.revokeObjectURL(item.cover) : '';
          typeof item.url === 'string' ? URL.revokeObjectURL(item.url) : '';
        }
      }),
      map(([{ id }, item]) => id),
      map((id) => removeItemSuccess({ id }))
    )
  );

  getCover$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getItemCover),
      mergeMap(({ id, folder }) =>
        this.coverService.getCover(folder).pipe(
          map((cover) => getItemCoverSuccess({ update: { id, changes: { cover } } })),
          catchError((error) => of(getItemCoverError({ update: { id, changes: { cover: this.errorService.getError(error) } } })))
        )
      )
    )
  );

  shuffle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(shufflePlaylist),
      withLatestFrom(this.store.pipe(select(selectPlaylist))),
      map(([_, playlist]) => {
        shuffleArray(playlist);
        return shufflePlaylistSuccess({ updates: playlist.map((item, index) => ({ id: item.id, changes: { index } })) });
      })
    )
  );

  clearBlobs$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearBlobs),
        concatLatestFrom(() => this.store.pipe(select(selectPlaylistBlobs))),
        filter(([_, blobs]) => blobs.length > 0),
        tap(([_, blobs]) =>
          blobs.forEach((blob) => {
            typeof blob === 'string' ? URL.revokeObjectURL(blob) : '';
          })
        )
      ),
    { dispatch: false }
  );

  constructor(private actions$: Actions, private store: Store, private coverService: CoverService, private errorService: ErrorService, @Inject(BASE_PATH) private readonly basePath: string) {}
}
