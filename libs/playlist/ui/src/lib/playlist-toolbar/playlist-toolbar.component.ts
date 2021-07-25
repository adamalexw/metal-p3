import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaylistDto } from '@metal-p3/player/domain';

@Component({
  selector: 'app-playlist-toolbar',
  templateUrl: './playlist-toolbar.component.html',
  styleUrls: ['./playlist-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistToolbarComponent {
  @Input()
  duration = 0;

  @Input()
  playlists: PlaylistDto[] | null = null;

  @Input()
  activePlaylist = 0;

  @Output()
  readonly loadPlaylists = new EventEmitter<void>();

  @Output()
  readonly savePlaylist = new EventEmitter<void>();

  @Output()
  readonly createPlaylist = new EventEmitter<string>();

  @Output()
  readonly loadPlaylist = new EventEmitter<number>();

  @Output()
  readonly clearPlaylist = new EventEmitter<void>();

  @Output()
  readonly deletePlaylist = new EventEmitter<void>();

  @Output()
  readonly closePlaylist = new EventEmitter<void>();

  saving = false;
  playlistName: string | undefined;

  onCreate() {
    if (!this.saving) {
      this.saving = true;
      return;
    }

    this.createPlaylist.emit(this.playlistName);
    this.saving = false;
    this.playlistName = undefined;
  }

  onDelete(result: boolean) {
    if (result) {
      this.deletePlaylist.emit();
    }
  }
}
