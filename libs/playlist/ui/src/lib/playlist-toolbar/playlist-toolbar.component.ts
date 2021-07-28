import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaylistDto } from '@metal-p3/playlist/domain';

@Component({
  selector: 'app-playlist-toolbar',
  templateUrl: './playlist-toolbar.component.html',
  styleUrls: ['./playlist-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistToolbarComponent {
  @Input()
  duration: number | null | undefined = 0;

  @Input()
  playlistSize: number | null | undefined;

  @Input()
  playlists: PlaylistDto[] | null = null;

  @Input()
  activePlaylist: number | null | undefined = 0;

  @Input()
  playlistName: string | null | undefined = '';

  @Output()
  readonly loadPlaylists = new EventEmitter<void>();

  @Output()
  readonly updatePlaylist = new EventEmitter<string>();

  @Output()
  readonly createPlaylist = new EventEmitter<string>();

  @Output()
  readonly loadPlaylist = new EventEmitter<number>();

  @Output()
  readonly shuffle = new EventEmitter<void>();

  @Output()
  readonly clearPlaylist = new EventEmitter<void>();

  @Output()
  readonly deletePlaylist = new EventEmitter<void>();

  @Output()
  readonly closePlaylist = new EventEmitter<void>();

  saving = false;

  onLoadPlaylists() {
    if (!this.playlists?.length) {
      this.loadPlaylists.emit();
    }
  }

  onCreate() {
    if (!this.saving) {
      this.saving = true;
      return;
    }

    if (this.playlistName) {
      this.createPlaylist.emit(this.playlistName);
      this.saving = false;
    }
  }

  onDelete(result: boolean) {
    if (result) {
      this.deletePlaylist.emit();
    }
  }
}
