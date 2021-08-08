import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-extra-files-toolbar',
  templateUrl: './extra-files-toolbar.component.html',
  styleUrls: ['./extra-files-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesToolbarComponent {
  @Input()
  running: boolean | null | undefined;

  @Output()
  readonly stop = new EventEmitter<void>();
}
