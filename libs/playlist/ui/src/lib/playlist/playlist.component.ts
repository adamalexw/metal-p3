import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { PlaylistItem } from '@metal-p3/player/domain';
import { cloneDeep } from 'lodash-es';

@Component({
  imports: [CdkTableModule, DragDropModule, MatTableModule, MatIconModule],
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistComponent {
  readonly playlist = input<PlaylistItem[]>([]);
  readonly currentItem = input<PlaylistItem>();

  readonly playItem = output<string>();
  readonly resumeItem = output<void>();
  readonly pauseItem = output<void>();
  readonly reorder = output<PlaylistItem[]>();
  readonly removeItem = output<string>();
  readonly hide = output<void>();

  displayedColumns = ['action', 'trackNumber', 'title', 'artist', 'duration'];

  drop(event: CdkDragDrop<string[]>) {
    const playlist = this.playlist();

    if (playlist) {
      const newOrder = cloneDeep(playlist);
      moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
      this.reorder.emit(newOrder);
    }
  }
}
