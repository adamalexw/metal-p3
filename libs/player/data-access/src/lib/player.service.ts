import { Injectable } from '@angular/core';
import { Track } from '@metal-p3/api-interfaces';
import { PlaylistItem } from '@metal-p3/player/domain';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { from, Observable } from 'rxjs';
import { concatAll, filter, map, take, tap, toArray, withLatestFrom } from 'rxjs/operators';
import { selectPlaylistItemSize } from '..';
import { addTracksToPlaylist, addTrackToPlaylist, clearBlobs, clearPlaylist, getItemCover, playItem } from './+state/actions';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  constructor(private store: Store) {}

  playAlbum(albumId: number, tracks$: Observable<Track[] | undefined>): void {
    this.clear();
    this.addAlbumToPlaylist(albumId, tracks$);
  }

  addAlbumToPlaylist(albumId: number, tracks$: Observable<Track[] | undefined>) {
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

  playTrack(track: Track, albumId: number) {
    this.clear();
    this.addTrackToPlaylist(track, albumId, true);
  }

  addTrackToPlaylist(track: Track, albumId: number, play = false) {
    this.store
      .select(selectPlaylistItemSize)
      .pipe(
        take(1),
        map((size) => this.mapTrackToPlaylistItem(track, albumId, size ? size + 1 : 0)),
        tap((track) => {
          this.store.dispatch(addTrackToPlaylist({ track }));
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.store.dispatch(getItemCover({ id: track.id, folder: track.folder! }));
        }),
        tap((track) => {
          if (play || track.index === 0) {
            this.store.dispatch(playItem({ id: track.id }));
          }
        })
      )
      .subscribe();
  }

  mapTrackToPlaylistItem(track: Track, albumId: number, index: number): PlaylistItem {
    return { ...track, id: UUID.UUID(), albumId, index };
  }

  playPlaylist(tracks: Observable<Track>[]) {
    this.clear();

    from(tracks)
      .pipe(
        concatAll(),
        toArray(),
        map((tracks) => tracks?.map((track, index) => this.mapTrackToPlaylistItem(track, 0, index))),
        tap((tracks) => this.addTracks(tracks))
      )
      .subscribe();
  }

  private clear() {
    this.store.dispatch(clearBlobs());
    this.store.dispatch(clearPlaylist());
  }

  private addTracks(tracks: PlaylistItem[] | undefined) {
    if (tracks) {
      this.store.dispatch(addTracksToPlaylist({ tracks }));
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tracks.forEach((track) => this.store.dispatch(getItemCover({ id: track.id, folder: track.folder! })));
    }
  }
}
