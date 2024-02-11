import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlaylistDto } from '@metal-p3/playlist/domain';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { TimePipe } from '@metal-p3/track/util';

@Component({
  standalone: true,
  imports: [FormsModule, TimePipe, ConfirmDeleteDirective, MatToolbarModule, MatMenuModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule],
  selector: 'app-playlist-toolbar',
  templateUrl: './playlist-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistToolbarComponent {
  duration = input<number | null | undefined>(0);
  playlistSize = input<number | null | undefined>();
  playlists = input<PlaylistDto[] | null>(null);
  activePlaylist = input<number | null | undefined>(0);
  playlistName = input<string | null | undefined>('');
  transferring = input<boolean | null>(false);

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

  @Output()
  readonly transfer = new EventEmitter<void>();

  @Output()
  readonly togglePlaylist = new EventEmitter<void>();

  saving = false;

  onLoadPlaylists() {
    if (!this.playlists()?.length) {
      this.loadPlaylists.emit();
    }
  }

  onCreate() {
    if (!this.saving) {
      this.saving = true;
      return;
    }

    const platListName = this.playlistName();

    if (platListName) {
      this.createPlaylist.emit(platListName);
      this.saving = false;
    }
  }

  onDelete(result: boolean) {
    if (result) {
      this.deletePlaylist.emit();
    }
  }
}
