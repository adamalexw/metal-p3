import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { selectPlaylistItemSize, shufflePlaylist } from '@metal-p3/player/data-access';
import { createPlaylist, deletePlaylist, loadPlaylist, loadPlaylists, savePlaylist, selectActivePlaylist, selectActivePlaylistId, selectPlaylists } from '@metal-p3/playlist/data-access';
import { select, Store } from '@ngrx/store';
import { map, tap } from 'rxjs/operators';

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

  playlists$ = this.store.pipe(select(selectPlaylists));
  activePlaylistId$ = this.store.pipe(select(selectActivePlaylistId));
  playlistName$ = this.store.pipe(
    select(selectActivePlaylist),
    map((playlist) => playlist?.name)
  );
  playlistSize$ = this.store.pipe(select(selectPlaylistItemSize)).pipe(tap(console.log));

  constructor(private store: Store) {}

  onLoadPlaylists() {
    this.store.dispatch(loadPlaylists());
  }

  onCreatePlaylist(name: string) {
    this.store.dispatch(createPlaylist({ name }));
  }

  onUpdatePlaylist(name: string) {
    this.store.dispatch(savePlaylist({ name }));
  }

  onLoadPlaylist(id: number) {
    this.store.dispatch(loadPlaylist({ id }));
  }

  onShuffle() {
    this.store.dispatch(shufflePlaylist());
  }

  onDeletePlaylist() {
    this.store.dispatch(deletePlaylist());
  }
}
