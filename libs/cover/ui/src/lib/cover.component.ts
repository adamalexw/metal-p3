import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafePipe } from '@metal-p3/shared/safe-pipe';
import { CoverDragDirective } from './cover-dnd.directive';

@Component({
  standalone: true,
  imports: [NgIf, CoverDragDirective, SafePipe, MatProgressSpinnerModule],
  selector: 'app-cover',
  templateUrl: './cover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverComponent {
  @Input()
  loading: boolean | null = false;

  @Input()
  cover: string | null | undefined;

  @Input()
  coverError: string | undefined;

  @Input()
  width: number | null = 238;

  @Input()
  height: number | null = 238;

  @Input()
  enableDnd = false;

  @Output()
  readonly coverUrl = new EventEmitter<string>();
}
