/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { PlayerService, removeItem, selectItemById, selectPlaylist, updatePlaylist } from '@metal-p3/player/data-access';
import { PlaylistItem, playlistItemToDto } from '@metal-p3/player/domain';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { TrackService } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, concatMapTo, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { PlaylistService } from '../playlist.service';
import {
  createPlaylist,
  createPlaylistError,
  createPlaylistSuccess,
  deletePlaylist,
  deletePlaylistError,
  deletePlaylistSuccess,
  loadPlaylist,
  loadPlaylists,
  loadPlaylistsError,
  loadPlaylistsSuccess,
  loadPlaylistSuccess,
  savePlaylist,
  savePlaylistError,
  savePlaylistSuccess,
} from './actions';
import { selectActivePlaylistId, selectPlaylistById } from './selectors';

@Injectable()
export class PlayerEffects {
  loadPlaylists$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPlaylists),
      concatMapTo(this.playlistService.getPlaylists()),
      map((playlists) => loadPlaylistsSuccess({ playlists })),
      catchError((error) => of(loadPlaylistsError({ error: this.errorService.getError(error) })))
    )
  );

  loadPlaylist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPlaylist),
      concatLatestFrom(({ id }) => this.store.pipe(select(selectPlaylistById(id)))),
      tap(([{ id }, playlist]) => {
        const tracks: Observable<Track>[] = [];

        playlist?.items.forEach((item) => tracks.push(this.trackService.getTrack(item.itemPath).pipe(map((track) => ({ ...track, playlistItemId: item.id })))));

        this.playerService.playPlaylist(tracks);
      }),
      map(([{ id }, playlist]) => loadPlaylistSuccess({ id }))
    )
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createPlaylist),
      withLatestFrom(this.store.pipe(select(selectPlaylist))),
      map(([{ name }, items]) => {
        const playlist: PlaylistDto = {
          id: -1,
          name,
          items: items.map((i, index) => ({ id: -1, playlistId: -1, itemPath: i.fullPath || '', itemIndex: index })),
        };

        return playlist;
      }),
      concatMap((playlist) => this.playlistService.createPlaylist(playlist)),
      map((playlist) => createPlaylistSuccess({ playlist })),
      catchError((error) => of(createPlaylistError({ error: this.errorService.getError(error) })))
    )
  );

  save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(savePlaylist),
      withLatestFrom(this.store.pipe(select(selectActivePlaylistId)), this.store.pipe(select(selectPlaylist))),
      map(([{ name }, id, items]) => ({
        id: id!,
        name,
        items: items.map((item) => playlistItemToDto(item, id)),
      })),
      concatMap((playlist: PlaylistDto) => this.playlistService.updatePlaylist(playlist)),
      map((playlist) => savePlaylistSuccess({ playlist })),
      catchError((error) => of(savePlaylistError({ error: this.errorService.getError(error) })))
    )
  );

  saveSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(savePlaylistSuccess),
      withLatestFrom(this.store.pipe(select(selectPlaylist))),
      map(([{ playlist }, items]) => {
        const newItems = items.filter((item) => item.playlistItemId ?? -1 < 0);

        if (!newItems.length) {
          return [];
        }

        const updateItems: Update<PlaylistItem>[] = [];

        newItems.forEach((newItem) => {
          const playlistItem = playlist.items.find((i) => i.itemIndex === newItem.index);

          if (playlistItem) {
            updateItems.push({ id: newItem.id, changes: { playlistItemId: playlistItem.id } });
          }
        });

        return updateItems;
      }),
      filter((updates) => updates?.length > 0),
      map((updates) => updatePlaylist({ updates }))
    )
  );

  removeItem$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(removeItem),
        concatLatestFrom(({ id }) => this.store.pipe(select(selectItemById(id)))),
        map(([{ id }, item]) => item),
        filter((item) => !!item?.playlistItemId),
        concatMap((item) => this.playlistService.removeItem(item!.playlistItemId!))
      ),
    {
      dispatch: false,
    }
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deletePlaylist),
      withLatestFrom(this.store.pipe(select(selectActivePlaylistId))),
      concatMap(([_, id]) =>
        this.playlistService.deletePlaylist(id!).pipe(
          map(() => deletePlaylistSuccess({ id: id! })),
          catchError((error) => {
            return of(deletePlaylistError({ error }));
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private playlistService: PlaylistService,
    private trackService: TrackService,
    private playerService: PlayerService,
    private errorService: ErrorService
  ) {}
}
