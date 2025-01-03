import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  imports: [MatButtonModule, MatSliderModule, MatIconModule],
  selector: 'app-volume',
  templateUrl: './volume.component.html',
  styleUrls: ['./volume.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeComponent {
  readonly volume = output<number>();
  readonly mute = output<void>();

  gain = 1;
  restoreGain = 1;
  muted = false;
  muteIcon: 'volume_off' | 'volume_mute' = 'volume_mute';

  onVolumeChange(value: number | null) {
    if (value) {
      this.restoreGain = value;
    }

    this.volume.emit(value ?? 0);
  }

  onMute() {
    if (this.gain > 0) {
      this.muted = true;
      this.gain = 0;
      this.muteIcon = 'volume_off';
      this.mute.emit();
      return;
    }

    this.muted = false;
    this.gain = this.restoreGain;
    this.muteIcon = 'volume_mute';
    this.volume.emit(this.gain);
  }
}
