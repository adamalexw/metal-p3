import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input()
  running: boolean | null | undefined;

  @Output()
  readonly stop = new EventEmitter<void>();
}
