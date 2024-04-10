import { Directive, ElementRef, HostListener, input, output } from '@angular/core';
import { OverlayService } from '../overlay/overlay.service';
import { ConfirmDeleteComponent } from './confirm-delete.component';

@Directive({
  standalone: true,
  selector: '[appConfirmDelete]',
  providers: [OverlayService],
})
export class ConfirmDeleteDirective {
  private confirmDeleteComponent = ConfirmDeleteComponent;

  itemName = input('');
  readonly confirmResult = output<boolean>();

  @HostListener('click') onClick() {
    const ref = this.overlayService.open(this.element.nativeElement, this.confirmDeleteComponent, { name: this.itemName() });

    ref.afterClosed$.subscribe((res) => {
      this.confirmResult.emit((res.data as boolean) || false);
    });
  }

  constructor(
    private readonly element: ElementRef,
    private readonly overlayService: OverlayService,
  ) {}
}
