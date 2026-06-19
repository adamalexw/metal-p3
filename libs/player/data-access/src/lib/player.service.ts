import { inject, Injectable } from '@angular/core';
import { TrackDto } from '@metal-p3/api-interfaces';
import { PlaylistItem } from '@metal-p3/player/domain';
import { AlbumActions } from '@metal-p3/shared/data-access';
import { Track } from '@metal-p3/track/domain';
import { Store } from '@ngrx/store';
import { nanoid } from 'nanoid';
import { concatAll, filter, from, map, Observable, take, tap, toArray, withLatestFrom } from 'rxjs';
import { PlayerStore } from './player.store';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly store = inject(Store);
  private readonly playerStore = inject(PlayerStore);

  playAlbum(albumId: number, tracks$: Observable<TrackDto[] | undefined>): void {
    this.addAlbumToPlaylist(albumId, tracks$, true);
  }

  addAlbumToPlaylist(albumId: number, tracks$: Observable<TrackDto[] | undefined>, clearFirst = false) {
    tracks$
      .pipe(
        filter((tracks) => !!tracks?.length),
        take(1),
        tap(() => {
          if (clearFirst) this.clear();
        }),
        map((tracks) => {
          const size = this.playerStore.playlistSize();
          return tracks?.map((track, index) => this.mapTrackToPlaylistItem(track, albumId, index + size));
        }),
        tap((tracks) => this.addTracks(tracks)),
        tap(() => this.store.dispatch(AlbumActions.setPlayed({ id: albumId, played: true }))),
      )
      .subscribe();
  }

  playTrack(track: TrackDto, albumId: number) {
    this.addTrackToPlaylist(track, albumId, true, true);
  }

  addTrackToPlaylist(track: TrackDto, albumId: number, play = false, clearFirst = false) {
    if (clearFirst) {
      this.clear();
    }
    const size = this.playerStore.playlistSize();
    const item = this.mapTrackToPlaylistItem(track, albumId, size ? size + 1 : 0);
    this.playerStore.addItem(item);
    
    if (play || item.index === 0) {
      this.playerStore.play(item.id);
    }
  }

  mapTrackToPlaylistItem(track: TrackDto, albumId: number, index: number): PlaylistItem {
    return { ...track, id: nanoid(), albumId, index };
  }

  playPlaylist(tracks: Observable<Track>[]) {
    from(tracks)
      .pipe(
        concatAll(),
        toArray(),
        tap(() => this.clear()),
        map((tracks) => tracks?.map((track, index) => this.mapTrackToPlaylistItem(track, 0, index))),
        tap((tracks) => this.addTracks(tracks)),
        take(1),
      )
      .subscribe();
  }

  private clear() {
    this.playerStore.clear();
  }

  private addTracks(tracks: PlaylistItem[] | undefined) {
    if (tracks && tracks.length > 0) {
      this.playerStore.addItems(tracks);
    }
  }
}
