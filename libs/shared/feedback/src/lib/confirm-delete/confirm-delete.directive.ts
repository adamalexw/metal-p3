import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { ConfirmDeleteComponent } from './confirm-delete.component';

@Directive({
  standalone: true,
  selector: '[appConfirmDelete]',
  providers: [OverlayService],
})
export class ConfirmDeleteDirective {
  private confirmDeleteComponent = ConfirmDeleteComponent;

  @Input()
  itemName = '';

  @Output()
  readonly confirmResult = new EventEmitter<boolean>();

  @HostListener('click') onClick() {
    const ref = this.overlayService.open(this.element.nativeElement, this.confirmDeleteComponent, { name: this.itemName });

    ref.afterClosed$.subscribe((res) => {
      this.confirmResult.emit((res.data as boolean) || false);
    });
  }

  constructor(private element: ElementRef, private overlayService: OverlayService) {}
}
