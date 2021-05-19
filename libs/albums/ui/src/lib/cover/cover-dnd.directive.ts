import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appCoverDnd]',
})
export class CoverDragDirective {
  @Output()
  coverUrl = new EventEmitter<string>();

  @HostBinding('class') private coverClass = '';

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.coverClass = 'opacity-25';
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    this.coverClass = '';

    const data = evt?.dataTransfer?.getData('text');

    if (data) {
      this.coverUrl.emit(data);
    }
  }
}
