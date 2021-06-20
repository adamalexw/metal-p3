import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppOverlayRef } from '../overlay/overlay-ref';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteComponent {
  constructor(public ref: AppOverlayRef) {}

  close(value: boolean) {
    this.ref.close(value);
  }
}
