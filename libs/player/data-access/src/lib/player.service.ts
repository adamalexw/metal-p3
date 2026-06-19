import { inject, Injectable } from '@angular/core';
import { TrackDto } from '@metal-p3/api-interfaces';
import { PlaylistItem } from '@metal-p3/player/domain';
import { AlbumStore } from '@metal-p3/album/data-access';
import { Track } from '@metal-p3/track/domain';
import { nanoid } from 'nanoid';
import { PlayerStore } from './player.store';

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  private readonly albumStore = inject(AlbumStore);
  private readonly playerStore = inject(PlayerStore);

  playAlbum(albumId: number, tracks: TrackDto[] | undefined): void {
    this.addAlbumToPlaylist(albumId, tracks, true);
  }

  addAlbumToPlaylist(albumId: number, tracks: TrackDto[] | undefined, clearFirst = false) {
    if (!tracks?.length) return;

    if (clearFirst) {
      this.clear();
    }

    const size = this.playerStore.playlistSize();
    const items = tracks.map((track, index) => this.mapTrackToPlaylistItem(track, albumId, index + size));

    this.addTracks(items);
    this.albumStore.setPlayed({ id: albumId, played: true });
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

  playPlaylist(tracks: Track[]) {
    if (!tracks?.length) return;

    const items = tracks.map((track, index) => this.mapTrackToPlaylistItem(track, 0, index));
    this.playerStore.replacePlaylist(items);
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
