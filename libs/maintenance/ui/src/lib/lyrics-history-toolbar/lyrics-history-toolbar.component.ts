import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  imports: [NavToolbarComponent, MatIconModule, MatButtonModule, MatMenuModule, MatProgressBarModule],
  selector: 'app-lyrics-history-toolbar',
  templateUrl: './lyrics-history-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryToolbarComponent {
  getting = input<boolean | null>(false);
  checking = input<boolean | null>(false);

  readonly viewPriority = output<void>();
  readonly checkPriority = output<void>();
  readonly viewCheck = output<void>();
  readonly startCheck = output<void>();
  readonly stopCheck = output<void>();
}
