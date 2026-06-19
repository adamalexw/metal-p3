import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafePipe } from '@metal-p3/shared/safe-pipe';
import { CoverDragDirective } from './cover-dnd.directive';
import { BLANK_COVER } from '@metal-p3/shared/utils';

@Component({
  imports: [CoverDragDirective, MatProgressSpinnerModule, SafePipe],
  selector: 'app-cover',
  templateUrl: './cover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverComponent {
  readonly loading = input(false);
  readonly cover = input<string>();
  readonly coverError = input<string>();
  readonly width = input<number>();
  readonly height = input<number>();
  readonly enableDnd = input(false);

  readonly coverUrl = output<string>();

  readonly blankCover = BLANK_COVER;
}
