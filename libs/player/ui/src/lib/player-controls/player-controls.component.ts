import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
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
  footerMode = input<boolean | null>(false);
  isFirstItemPlaying = input<boolean | null | undefined>(false);
  isLastItemPlaying = input<boolean | null | undefined>(false);
  currentItem = input<PlaylistItem | null | undefined>();
  elapsedTime = input<number | null | undefined>(0);
  toggleIcon = input<'expand_more' | 'expand_less' | null>('expand_more');
  gain = input(1);

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
