import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appAddAlbum]',
})
export class AddAlbumDirective {
  @Output()
  albumAdded = new EventEmitter<string | string[]>();

  @HostBinding('class') private addClass = '';

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.addClass = 'opacity-25';
  }

  @HostListener('drop', ['$event']) public onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();

    this.addClass = '';

    const folders = evt?.dataTransfer?.files;

    if (folders?.length) {
      this.albumAdded.emit(Array.from(folders).map((f) => f.name));
    }
  }
}
