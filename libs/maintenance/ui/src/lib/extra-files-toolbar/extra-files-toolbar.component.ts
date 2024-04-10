import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  standalone: true,
  imports: [NavToolbarComponent, MatIconModule, MatProgressBarModule],
  selector: 'app-extra-files-toolbar',
  templateUrl: './extra-files-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesToolbarComponent {
  running = input<boolean | null | undefined>();
  readonly stop = output<void>();
}
