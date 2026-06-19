import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  imports: [MatListModule, MatIconModule],
  selector: 'app-extra-files',
  templateUrl: './extra-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesComponent {
  readonly folders = input<string[]>([]);
  readonly openFolder = output<string>();
}
