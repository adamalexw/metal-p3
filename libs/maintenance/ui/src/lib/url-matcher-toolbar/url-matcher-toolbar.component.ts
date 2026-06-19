import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  imports: [NavToolbarComponent, MatIconModule, MatProgressBarModule],
  selector: 'app-url-matcher-toolbar',
  templateUrl: './url-matcher-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherToolbarComponent {
  readonly getting = input(false);
  readonly matching = input(false);

  readonly startMatching = output<void>();
  readonly stopMatching = output<void>();
}
