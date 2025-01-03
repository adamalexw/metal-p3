import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AppOverlayRef } from '../overlay/overlay-ref';

@Component({
  imports: [MatCardModule, MatButtonModule],
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteComponent {
  public readonly ref = inject(AppOverlayRef);

  close(value: boolean) {
    this.ref.close(value);
  }
}
