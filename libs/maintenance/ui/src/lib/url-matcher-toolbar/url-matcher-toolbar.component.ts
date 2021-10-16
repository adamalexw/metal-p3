import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-url-matcher-toolbar',
  templateUrl: './url-matcher-toolbar.component.html',
  styleUrls: ['./url-matcher-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherToolbarComponent {
  @Input()
  getting = false;

  @Input()
  matching: boolean | null | undefined = false;

  @Output()
  readonly startMatching = new EventEmitter<void>();

  @Output()
  readonly stopMatching = new EventEmitter<void>();
}
