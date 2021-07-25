/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { Track } from '@metal-p3/api-interfaces';
import { PlayerService, selectPlaylist } from '@metal-p3/player/data-access';
import { PlaylistDto } from '@metal-p3/player/domain';
import { ErrorService } from '@metal-p3/shared/error';
import { TrackService } from '@metal-p3/track/data-access';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, concatMapTo, map, tap } from 'rxjs/operators';
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
} from './actions';
import { selectActivePlaylist, selectPlaylistById } from './selectors';

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

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createPlaylist),
      concatLatestFrom(() => this.store.pipe(select(selectPlaylist))),
      map(([{ name }, items]) => {
        const playlist: PlaylistDto = {
          id: -1,
          name,
          items: items.map((i) => ({ id: -1, playlistId: -1, itemPath: i.fullPath || '' })),
        };

        return playlist;
      }),
      concatMap((playlist) => this.playlistService.createPlaylist(playlist)),
      map((playlist) => createPlaylistSuccess({ playlist })),
      catchError((error) => of(createPlaylistError({ error: this.errorService.getError(error) })))
    )
  );

  loadPlaylist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadPlaylist),
        concatLatestFrom(({ id }) => this.store.pipe(select(selectPlaylistById(id)))),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        map(([{ id }, playlist]) => playlist),
        tap((playlist) => {
          const tracks: Observable<Track>[] = [];

          playlist?.items.forEach((item) => tracks.push(this.trackService.getTrack(item.itemPath)));

          this.playerService.playPlaylist(tracks);
        })
      ),
    { dispatch: false }
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deletePlaylist),
      concatLatestFrom(() => this.store.pipe(select(selectActivePlaylist))),
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
