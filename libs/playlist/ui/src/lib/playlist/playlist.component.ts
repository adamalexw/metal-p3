import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkTableModule } from '@angular/cdk/table';
import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CoverComponent } from '@metal-p3/cover/ui';
import { PlaylistItem } from '@metal-p3/player/domain';
import { TimePipe } from '@metal-p3/track/util';
import { cloneDeep } from 'lodash-es';

@Component({
  standalone: true,
  imports: [NgIf, CoverComponent, TimePipe, CdkTableModule, DragDropModule, MatTableModule, MatIconModule],
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaylistComponent {
  @Input()
  playlist: PlaylistItem[] | null | undefined = [];

  @Input()
  currentItem: PlaylistItem | null | undefined;

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
    if (this.playlist) {
      const newOrder = cloneDeep(this.playlist);
      moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
      this.reorder.emit(newOrder);
    }
  }
}
