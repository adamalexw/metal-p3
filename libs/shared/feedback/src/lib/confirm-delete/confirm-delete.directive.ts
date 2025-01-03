import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { ConfirmDeleteComponent } from './confirm-delete.component';

@Directive({
  standalone: true,
  selector: '[appConfirmDelete]',
  host: {
    '(click)': 'onClick()',
  },
  providers: [OverlayService],
})
export class ConfirmDeleteDirective {
  private readonly element = inject(ElementRef);
  private readonly overlayService = inject(OverlayService);

  private confirmDeleteComponent = ConfirmDeleteComponent;

  itemName = input('');
  readonly confirmResult = output<boolean>();

  onClick() {
    const ref = this.overlayService.open(this.element.nativeElement, this.confirmDeleteComponent, { name: this.itemName() });

    ref.afterClosed$.subscribe((res) => {
      this.confirmResult.emit((res.data as boolean) || false);
    });
  }
}
