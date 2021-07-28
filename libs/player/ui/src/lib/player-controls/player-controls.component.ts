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
  footerMode: boolean | null | undefined = false;

  @Input()
  isFirstItemPlaying: boolean | null | undefined = false;

  @Input()
  isLastItemPlaying: boolean | null | undefined = false;

  @Input()
  currentItem: PlaylistItem | null | undefined;

  @Input()
  elapsedTime: number | null | undefined = 0;

  @Input()
  toggleIcon: 'expand_more' | 'expand_less' | null = 'expand_more';

  @Input()
  gain = 1;

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
  readonly volume = new EventEmitter<number>();

  @Output()
  readonly mute = new EventEmitter<void>();

  @Output()
  readonly toggleView = new EventEmitter<number>();

  onSeek(value: number | null) {
    if (value) {
      this.seekTo.emit(value);
    }
  }
}
