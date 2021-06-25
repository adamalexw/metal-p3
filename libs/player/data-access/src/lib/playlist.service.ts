import { Injectable } from "@angular/core";
import { Track } from "@metal-p3/api-interfaces";
import { PlaylistItem } from "@metal-p3/player/domain";
import { Store } from "@ngrx/store";
import { UUID } from 'angular2-uuid';
import { Observable } from "rxjs";
import { filter, map, take, tap, withLatestFrom } from "rxjs/operators";
import { selectPlaylistItemSize } from "..";
import { addTracksToPlaylist, addTrackToPlaylist, clearPlaylist, playItem } from "./+state/actions";

@Injectable({
    providedIn: 'root',
  })
  export class PlaylistService {
    constructor(private store: Store) {  }

    playAlbum(albumId: number, tracks$: Observable<Track[] | undefined>): void {
        this.store.dispatch(clearPlaylist());
        this.addAlbumToPlaylist(albumId, tracks$);
      }
    
      addAlbumToPlaylist(albumId: number, tracks$: Observable<Track[] | undefined>) {
        tracks$
          .pipe(
              filter(tracks => !!tracks),
            take(1),
            withLatestFrom(this.store.select(selectPlaylistItemSize)),
            map(([tracks, size]) => tracks?.map((track, index) => this.mapTrackToPlaylistItem(track, albumId, index + size))),
            tap((tracks) => this.store.dispatch(addTracksToPlaylist({ tracks }))),
          )
          .subscribe();
      }
    
      playTrack(track: Track, albumId: number) {
        this.store.dispatch(clearPlaylist());
        this.addTrackToPlaylist(track, albumId, true);
      }
    
      addTrackToPlaylist(track: Track, albumId: number, play = false) {
        this.store.select(selectPlaylistItemSize).pipe(
            take(1),
            map(size => this.mapTrackToPlaylistItem(track, albumId, size ? size + 1 : 0)),
            tap(track => this.store.dispatch(addTrackToPlaylist({ track }))),
            tap(track => {
                if(play || track.index === 0) {
                    this.store.dispatch(playItem({ id: track.id }));
                }
            }),
        ).subscribe();
      }

      mapTrackToPlaylistItem(track: Track, albumId: number, index: number): PlaylistItem {
        return { ...track, id: UUID.UUID(), albumId, index };
      }
  }