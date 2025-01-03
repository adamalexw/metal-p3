import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
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
  playlistName = model<string | null | undefined>('');
  transferring = input<boolean | null>(false);

  readonly loadPlaylists = output<void>();
  readonly updatePlaylist = output<string>();
  readonly createPlaylist = output<string>();
  readonly loadPlaylist = output<number>();
  readonly shuffle = output<void>();
  readonly clearPlaylist = output<void>();
  readonly deletePlaylist = output<void>();
  readonly closePlaylist = output<void>();
  readonly transfer = output<void>();
  readonly togglePlaylist = output<void>();

  protected readonly saving = signal(false);

  onLoadPlaylists() {
    if (!this.playlists()?.length) {
      this.loadPlaylists.emit();
    }
  }

  onCreate() {
    if (!this.saving()) {
      this.saving.set(true);
      return;
    }

    const platListName = this.playlistName();

    if (platListName) {
      this.createPlaylist.emit(platListName);
      this.saving.set(false);
    }
  }

  onDelete(result: boolean) {
    if (result) {
      this.deletePlaylist.emit();
    }
  }
}
