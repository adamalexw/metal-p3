import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaylistItem } from '@metal-p3/player/domain';
import { cloneDeep } from 'lodash-es';

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
  readonly resumeItem = new EventEmitter<void>();

  @Output()
  readonly pauseItem = new EventEmitter<void>();

  @Output()
  readonly reorder = new EventEmitter<PlaylistItem[]>();

  @Output()
  readonly removeItem = new EventEmitter<string>();

  displayedColumns = ['action', 'trackNumber', 'title', 'artist', 'duration'];

  drop(event: CdkDragDrop<string[]>) {
    const newOrder = cloneDeep(this.playlist);
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
    this.reorder.emit(newOrder);
  }
}
