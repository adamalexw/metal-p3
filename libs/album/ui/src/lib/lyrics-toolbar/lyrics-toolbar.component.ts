import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-lyrics-toolbar',
  templateUrl: './lyrics-toolbar.component.html',
  styleUrls: ['./lyrics-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsToolbarComponent {
  @Input()
  applying = false;

  @Output()
  apply = new EventEmitter<void>();

  constructor(private location: Location) {}

  onClose() {
    this.location.back();
  }
}
