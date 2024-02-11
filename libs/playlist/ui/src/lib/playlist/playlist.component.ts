import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CoverComponent } from '@metal-p3/cover/ui';
import { PlaylistItem } from '@metal-p3/player/domain';
import { TimePipe } from '@metal-p3/track/util';
import { cloneDeep } from 'lodash-es';

@Component({
  standalone: true,
  imports: [CoverComponent, TimePipe, CdkTableModule, DragDropModule, MatTableModule, MatIconModule],
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistComponent {
  playlist = input<PlaylistItem[] | null | undefined>([]);
  currentItem = input<PlaylistItem | null | undefined>();

  @Output()
  readonly playItem = new EventEmitter<string>();

  @Output()
  readonly resumeItem = new EventEmitter<void>();

  @Output()
  readonly pauseItem = new EventEmitter<void>();

  @Output()
  readonly reorder = new EventEmitter<PlaylistItem[]>();

  @Output()
  readonly removeItem = new EventEmitter<string>();

  @Output()
  readonly hide = new EventEmitter<void>();

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
