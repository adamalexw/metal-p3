import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlaylistItem } from '@metal-p3/player/domain';
import { TimePipe } from '@metal-p3/track/util';
import { VolumeComponent } from '../volume/volume.component';

@Component({
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, VolumeComponent, TimePipe, MatToolbarModule, MatSliderModule, MatIconModule],
  selector: 'app-player-controls',
  templateUrl: './player-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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

  onPrevious() {
    if ((this.elapsedTime ?? 0) > 10 || this.isFirstItemPlaying) {
      this.seekTo.emit(0);
      return;
    }

    this.previous.emit();
  }

  onSeek(value: number | null) {
    if (value) {
      this.seekTo.emit(value);
    }
  }
}
