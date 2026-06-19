import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlayerActions, selectPlaylistItemSize } from '@metal-p3/player/data-access';
import { PlaylistStore } from '@metal-p3/playlist/data-access';
import { PlaylistToolbarComponent } from '@metal-p3/playlist/ui';
import { Store } from '@ngrx/store';

@Component({
  imports: [PlaylistToolbarComponent],
  selector: 'app-playlist-shell',
  templateUrl: './playlist-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistShellComponent {
  readonly playlistStore = inject(PlaylistStore);
  private readonly store = inject(Store);

  duration = input<number | null | undefined>(0);

  readonly clearPlaylist = output<void>();
  readonly closePlaylist = output<void>();
  readonly togglePlaylist = output<void>();

  playlistSize = toSignal(this.store.select(selectPlaylistItemSize));

  onLoadPlaylists() {
    this.playlistStore.loadPlaylists();
  }

  onCreatePlaylist(name: string) {
    this.playlistStore.create(name);
  }

  onUpdatePlaylist(name: string) {
    this.playlistStore.save(name);
  }

  onLoadPlaylist(id: number) {
    this.playlistStore.loadPlaylist(id);
  }

  onShuffle() {
    this.store.dispatch(PlayerActions.shuffle());
  }

  onDeletePlaylist() {
    this.playlistStore.delete();
  }

  onTransfer() {
    this.playlistStore.transfer();
  }
}
