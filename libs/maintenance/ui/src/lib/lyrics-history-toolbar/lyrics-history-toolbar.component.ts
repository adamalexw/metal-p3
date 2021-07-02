import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-lyrics-history-toolbar',
  templateUrl: './lyrics-history-toolbar.component.html',
  styleUrls: ['./lyrics-history-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryToolbarComponent {
  @Input()
  getting = false;

  @Input()
  checking = false;

  @Output()
  readonly viewPriority = new EventEmitter<void>();

  @Output()
  readonly checkPriority = new EventEmitter<void>();

  @Output()
  readonly viewCheck = new EventEmitter<void>();

  @Output()
  readonly startCheck = new EventEmitter<void>();

  @Output()
  readonly stopCheck = new EventEmitter<void>();
}
