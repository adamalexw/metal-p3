import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { createPlaylist, deletePlaylist, loadPlaylist, loadPlaylists, savePlaylist, selectActivePlaylist, selectActivePlaylistId, selectPlaylists } from '@metal-p3/playlist/data-access';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-playlist-shell',
  templateUrl: './playlist-shell.component.html',
  styleUrls: ['./playlist-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistShellComponent {
  @Input()
  duration = 0;

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

  onDeletePlaylist() {
    this.store.dispatch(deletePlaylist());
  }
}
