import { Injectable } from '@angular/core';
import { PlayerActions, PlayerService, selectItemById, selectPlaylist } from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { playlistItemToDto } from '@metal-p3/player/util';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { nonNullable } from '@metal-p3/shared/utils';
import { TrackService } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, concatMapTo, filter, map, tap } from 'rxjs/operators';
import { PlaylistService } from '../playlist.service';
import { PlaylistActions } from './actions';
import { selectActivePlaylistId, selectPlaylistById } from './selectors';

@Injectable()
export class PlayerEffects {
  loadPlaylists$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlaylistActions.loadPlaylists),
      concatMapTo(this.playlistService.getPlaylists()),
      map((playlists) => PlaylistActions.loadPlaylistsSuccess({ playlists })),
      catchError((error) => of(PlaylistActions.loadPlaylistsError({ error: this.errorService.getError(error) })))
    );
  });

  loadPlaylist$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlaylistActions.loadPlaylist),
      concatLatestFrom(({ id }) => this.store.select(selectPlaylistById(id))),
      tap(([_, playlist]) => {
        const tracks: Observable<Track>[] = [];

        playlist?.items.forEach((item) => tracks.push(this.trackService.getTrack(item.itemPath).pipe(map((track) => ({ ...track, playlistItemId: item.id })))));

        this.playerService.playPlaylist(tracks);
      }),
      map(([{ id }, _playlist]) => PlaylistActions.loadPlaylistSuccess({ id }))
    );
  });

  create$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlaylistActions.create),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
      map(([{ name }, items]) => {
        const playlist: PlaylistDto = {
          id: -1,
          name,
          items: items.map((i, index) => ({ id: -1, playlistId: -1, itemPath: i.fullPath || '', itemIndex: index })),
        };

        return playlist;
      }),
      concatMap((playlist) => this.playlistService.createPlaylist(playlist)),
      map((playlist) => PlaylistActions.createSuccess({ playlist })),
      catchError((error) => of(PlaylistActions.createError({ error: this.errorService.getError(error) })))
    );
  });

  save$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlaylistActions.save),
      concatLatestFrom(() => [this.store.select(selectActivePlaylistId).pipe(nonNullable()), this.store.select(selectPlaylist)]),
      map(([{ name }, id, items]) => ({
        id,
        name,
        items: items.map((item) => playlistItemToDto(item, id)),
      })),
      concatMap((playlist: PlaylistDto) => this.playlistService.updatePlaylist(playlist)),
      map((playlist) => PlaylistActions.saveSuccess({ playlist })),
      catchError((error) => of(PlaylistActions.saveError({ error: this.errorService.getError(error) })))
    );
  });

  saveSuccess$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlaylistActions.saveSuccess),
      concatLatestFrom(() => this.store.select(selectPlaylist)),
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
      map((updates) => PlayerActions.updateItems({ updates }))
    );
  });

  removeItem$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(PlayerActions.remove),
        concatLatestFrom(({ id }) => this.store.select(selectItemById(id)).pipe(nonNullable())),
        map(([_, item]) => item),
        filter((item) => !!item.playlistItemId),
        concatMap((item) => this.playlistService.removeItem(item.playlistItemId || 0))
      );
    },
    {
      dispatch: false,
    }
  );

  delete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(PlaylistActions.delete),
      concatLatestFrom(() => this.store.select(selectActivePlaylistId).pipe(nonNullable())),
      concatMap(([_, id]) =>
        this.playlistService.deletePlaylist(id).pipe(
          map(() => PlaylistActions.deleteSuccess({ id })),
          catchError((error) => of(PlaylistActions.deleteError({ error })))
        )
      )
    );
  });

  constructor(
    private actions$: Actions,
    private store: Store,
    private playlistService: PlaylistService,
    private trackService: TrackService,
    private playerService: PlayerService,
    private errorService: ErrorService
  ) {}
}
