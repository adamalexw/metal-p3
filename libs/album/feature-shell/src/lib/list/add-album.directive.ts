import { Directive, HostListener, output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appAddAlbum]',
  host: {
    '[class]': 'addClass',
  },
})
export class AddAlbumDirective {
  readonly albumAdded = output<string[]>();

  addClass = '';

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
