import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafePipe } from '@metal-p3/shared/safe-pipe';
import { CoverDragDirective } from './cover-dnd.directive';
import { output } from '@angular/core';

@Component({
  standalone: true,
  imports: [CoverDragDirective, MatProgressSpinnerModule, SafePipe],
  selector: 'app-cover',
  templateUrl: './cover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverComponent {
  loading = input<boolean | null>(false);
  cover = input<string | null | undefined>();
  coverError = input<string | undefined>();
  width = input<number | null>(null);
  height = input<number | null>(null);
  enableDnd = input(false);

  readonly coverUrl = output<string>();
}
