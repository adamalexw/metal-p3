import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appAddAlbum]',
})
export class AddAlbumDirective {
  @Output()
  readonly albumAdded = new EventEmitter<string[]>();

  @HostBinding('class') private addClass = '';

  @HostListener('dragover', ['$event']) public onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.addClass = 'opacity-25';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.addClass = '';
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
