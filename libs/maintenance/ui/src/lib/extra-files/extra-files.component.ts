import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { input } from '@angular/core';

@Component({
  standalone: true,
  imports: [MatListModule, MatIconModule],
  selector: 'app-extra-files',
  templateUrl: './extra-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesComponent {
  folders = input<string[] | null>([]);

  @Output()
  readonly openFolder = new EventEmitter<string>();
}
