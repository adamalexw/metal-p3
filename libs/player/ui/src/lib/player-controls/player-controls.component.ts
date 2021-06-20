import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlaylistItem } from '@metal-p3/player/domain';

@Component({
  selector: 'app-player-controls',
  templateUrl: './player-controls.component.html',
  styleUrls: ['./player-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerControlsComponent {
  @Input()
  footerMode = false;

  @Input()
  isFirstItemPlaying = false;

  @Input()
  isLastItemPlaying = false;

  @Input()
  currentItem: PlaylistItem | undefined;

  @Input()
  elapsedTime: number | undefined;

  @Input()
  toggleIcon: 'expand_more' | 'expand_less' = 'expand_more';

  @Output()
  readonly previous = new EventEmitter<void>();

  @Output()
  readonly playItem = new EventEmitter<void>();

  @Output()
  readonly pauseItem = new EventEmitter<void>();

  @Output()
  readonly next = new EventEmitter<void>();

  @Output()
  readonly seekTo = new EventEmitter<number>();

  @Output()
  readonly toggleView = new EventEmitter<number>();

  onSliderChangeEnd(value: number) {
    this.seekTo.emit(value);
  }
}
