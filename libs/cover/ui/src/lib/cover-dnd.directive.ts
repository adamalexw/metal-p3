import { Directive, HostListener, input, output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appCoverDnd]',
  host: {
    '[class]': 'coverClass',
  },
})
export class CoverDragDirective {
  enableDnd = input(true);
  coverUrl = output<string>();

  coverClass = '';

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent) {
    if (this.enableDnd()) {
      evt.preventDefault();
      evt.stopPropagation();
      this.coverClass = 'opacity-25';
    }
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    if (this.enableDnd()) {
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
