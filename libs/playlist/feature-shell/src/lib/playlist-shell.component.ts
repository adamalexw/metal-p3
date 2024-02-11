import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject, input } from '@angular/core';
import { PlayerActions, selectPlaylistItemSize } from '@metal-p3/player/data-access';
import { PlaylistActions, selectActivePlaylistId, selectActivePlaylistName, selectPlaylistTransferring, selectPlaylists } from '@metal-p3/playlist/data-access';
import { PlaylistToolbarComponent } from '@metal-p3/playlist/ui';
import { Store } from '@ngrx/store';

@Component({
  standalone: true,
  imports: [AsyncPipe, PlaylistToolbarComponent],
  selector: 'app-playlist-shell',
  templateUrl: './playlist-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistShellComponent {
  private readonly store = inject(Store);

  duration = input<number | null | undefined>(0);

  @Output()
  readonly clearPlaylist = new EventEmitter<void>();

  @Output()
  readonly closePlaylist = new EventEmitter<void>();

  @Output()
  readonly togglePlaylist = new EventEmitter<void>();

  playlists$ = this.store.select(selectPlaylists);
  activePlaylistId$ = this.store.select(selectActivePlaylistId);
  playlistName$ = this.store.select(selectActivePlaylistName);
  playlistSize$ = this.store.select(selectPlaylistItemSize);
  transferring$ = this.store.select(selectPlaylistTransferring);

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

  onTransfer() {
    this.store.dispatch(PlaylistActions.transfer());
  }
}
