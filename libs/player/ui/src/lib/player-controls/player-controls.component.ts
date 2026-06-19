import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlaylistItem } from '@metal-p3/player/domain';
import { TimePipe } from '@metal-p3/track/util';
import { VolumeComponent } from '../volume/volume.component';

@Component({
  imports: [NgTemplateOutlet, VolumeComponent, TimePipe, MatToolbarModule, MatSliderModule, MatIconModule],
  selector: 'app-player-controls',
  templateUrl: './player-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PlayerControlsComponent {
  readonly footerMode = input(false);
  readonly isFirstItemPlaying = input(false);
  readonly isLastItemPlaying = input(false);
  readonly currentItem = input<PlaylistItem>();
  readonly elapsedTime = input(0);
  readonly toggleIcon = input<'expand_more' | 'expand_less'>('expand_more');
  readonly gain = input(1);

  readonly previous = output<void>();
  readonly playItem = output<void>();
  readonly pauseItem = output<void>();
  readonly next = output<void>();
  readonly seekTo = output<number>();
  readonly volume = output<number>();
  readonly mute = output<void>();
  readonly toggleView = output();

  onPrevious() {
    if ((this.elapsedTime() ?? 0) > 10 || this.isFirstItemPlaying()) {
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
