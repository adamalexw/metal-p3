import { Injectable } from '@angular/core';
import { TrackDto } from '@metal-p3/api-interfaces';
import { PlaylistItem } from '@metal-p3/player/domain';
import { Track } from '@metal-p3/track/domain';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { from, Observable } from 'rxjs';
import { concatAll, filter, map, take, tap, toArray, withLatestFrom } from 'rxjs/operators';
import { selectPlaylistItemSize } from '..';
import { PlayerActions } from './+state/actions';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  constructor(private store: Store) {}

  playAlbum(albumId: number, tracks$: Observable<TrackDto[] | undefined>): void {
    this.clear();
    this.addAlbumToPlaylist(albumId, tracks$);
  }

  addAlbumToPlaylist(albumId: number, tracks$: Observable<TrackDto[] | undefined>) {
    tracks$
      .pipe(
        filter((tracks) => !!tracks),
        take(1),
        withLatestFrom(this.store.select(selectPlaylistItemSize)),
        map(([tracks, size]) => tracks?.map((track, index) => this.mapTrackToPlaylistItem(track, albumId, index + size))),
        tap((tracks) => this.addTracks(tracks))
      )
      .subscribe();
  }

  playTrack(track: TrackDto, albumId: number) {
    this.clear();
    this.addTrackToPlaylist(track, albumId, true);
  }

  addTrackToPlaylist(track: TrackDto, albumId: number, play = false) {
    this.store
      .select(selectPlaylistItemSize)
      .pipe(
        take(1),
        map((size) => this.mapTrackToPlaylistItem(track, albumId, size ? size + 1 : 0)),
        tap((track) => {
          this.store.dispatch(PlayerActions.addItem({ track }));
        }),
        tap((track) => {
          if (play || track.index === 0) {
            this.store.dispatch(PlayerActions.play({ id: track.id }));
          }
        })
      )
      .subscribe();
  }

  mapTrackToPlaylistItem(track: TrackDto, albumId: number, index: number): PlaylistItem {
    return { ...track, id: UUID.UUID(), albumId, index };
  }

  playPlaylist(tracks: Observable<Track>[]) {
    this.clear();

    from(tracks)
      .pipe(
        concatAll(),
        toArray(),
        map((tracks) => tracks?.map((track, index) => this.mapTrackToPlaylistItem(track, 0, index))),
        tap((tracks) => this.addTracks(tracks)),
        take(1)
      )
      .subscribe();
  }

  private clear() {
    this.store.dispatch(PlayerActions.clear());
  }

  private addTracks(tracks: PlaylistItem[] | undefined) {
    if (tracks) {
      this.store.dispatch(PlayerActions.addItems({ tracks }));
      tracks.forEach((track) => this.store.dispatch(PlayerActions.getCover({ id: track.id, folder: track.folder || '' })));
    }
  }
}
