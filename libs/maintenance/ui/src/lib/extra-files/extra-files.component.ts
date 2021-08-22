import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-extra-files',
  templateUrl: './extra-files.component.html',
  styleUrls: ['./extra-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesComponent {
  @Input()
  folders: string[] | null = [];

  @Output()
  readonly openFolder = new EventEmitter<string>();
}
