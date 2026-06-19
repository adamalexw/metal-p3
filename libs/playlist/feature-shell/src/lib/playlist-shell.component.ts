import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { PlayerStore } from '@metal-p3/player/data-access';
import { PlaylistStore } from '@metal-p3/playlist/data-access';
import { PlaylistToolbarComponent } from '@metal-p3/playlist/ui';

@Component({
  imports: [PlaylistToolbarComponent],
  selector: 'app-playlist-shell',
  templateUrl: './playlist-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistShellComponent {
  readonly playlistStore = inject(PlaylistStore);
  private readonly playerStore = inject(PlayerStore);

  readonly duration = input<number>();

  readonly clearPlaylist = output<void>();
  readonly closePlaylist = output<void>();
  readonly togglePlaylist = output<void>();

  playlistSize = this.playerStore.playlistSize;

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
    this.playerStore.shuffle();
  }

  onDeletePlaylist() {
    this.playlistStore.delete();
  }

  onTransfer() {
    this.playlistStore.transfer();
  }
}
