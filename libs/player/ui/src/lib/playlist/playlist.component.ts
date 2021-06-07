import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaylistItem } from '@metal-p3/player/domain';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistComponent {
  @Input()
  playlist: PlaylistItem[] = [];

  @Input()
  currentItem: PlaylistItem | undefined;

  @Output()
  readonly playItem = new EventEmitter<string>();

  @Output()
  readonly clearPlaylist = new EventEmitter<void>();

  displayedColumns = ['trackNumber', 'title', 'artist', 'duration', 'action'];
}
