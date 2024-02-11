import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  standalone: true,
  imports: [NavToolbarComponent, MatIconModule, MatButtonModule, MatMenuModule, MatProgressBarModule],
  selector: 'app-lyrics-history-toolbar',
  templateUrl: './lyrics-history-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryToolbarComponent {
  getting = input<boolean | null>(false);
  checking = input<boolean | null>(false);

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
