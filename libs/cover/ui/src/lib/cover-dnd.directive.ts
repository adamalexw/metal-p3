import { Directive, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appCoverDnd]',
})
export class CoverDragDirective {
  @Input()
  enableDnd = true;

  @Output()
  coverUrl = new EventEmitter<string>();

  @HostBinding('class') private coverClass = '';

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent) {
    if (this.enableDnd) {
      evt.preventDefault();
      evt.stopPropagation();
      this.coverClass = 'opacity-25';
    }
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    if (this.enableDnd) {
      evt.preventDefault();
      evt.stopPropagation();

      this.coverClass = '';

      const data = evt?.dataTransfer?.getData('text');

      if (data) {
        this.coverUrl.emit(data);
      }
    }
  }
}
