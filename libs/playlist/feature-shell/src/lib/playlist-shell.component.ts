import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlayerActions, selectPlaylistItemSize } from '@metal-p3/player/data-access';
import { PlaylistActions, selectActivePlaylistId, selectActivePlaylistName, selectPlaylists } from '@metal-p3/playlist/data-access';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-playlist-shell',
  templateUrl: './playlist-shell.component.html',
  styleUrls: ['./playlist-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistShellComponent {
  @Input()
  duration: number | null | undefined = 0;

  @Output()
  readonly clearPlaylist = new EventEmitter<void>();

  @Output()
  readonly closePlaylist = new EventEmitter<void>();

  playlists$ = this.store.select(selectPlaylists);
  activePlaylistId$ = this.store.select(selectActivePlaylistId);
  playlistName$ = this.store.select(selectActivePlaylistName);
  playlistSize$ = this.store.select(selectPlaylistItemSize);

  constructor(private store: Store) {}

  onLoadPlaylists() {
    this.store.dispatch(PlaylistActions.loadPlaylists());
  }

  onCreatePlaylist(name: string) {
    this.store.dispatch(PlaylistActions.create({ name }));
  }

  onUpdatePlaylist(name: string) {
    this.store.dispatch(PlaylistActions.save({ name }));
  }

  onLoadPlaylist(id: number) {
    this.store.dispatch(PlaylistActions.loadPlaylist({ id }));
  }

  onShuffle() {
    this.store.dispatch(PlayerActions.shuffle());
  }

  onDeletePlaylist() {
    this.store.dispatch(PlaylistActions.delete());
  }
}
