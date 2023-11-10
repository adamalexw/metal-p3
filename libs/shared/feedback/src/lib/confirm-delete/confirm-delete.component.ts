import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AppOverlayRef } from '../overlay/overlay-ref';
import { OverlayComponent } from '../overlay/overlay.component';
import { ConfirmDeleteDirective } from './confirm-delete.directive';

@Component({
  standalone: true,
  imports: [ConfirmDeleteDirective, MatCardModule, MatButtonModule, OverlayComponent],
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteComponent {
  constructor(public readonly ref: AppOverlayRef) {}

  close(value: boolean) {
    this.ref.close(value);
  }
}
