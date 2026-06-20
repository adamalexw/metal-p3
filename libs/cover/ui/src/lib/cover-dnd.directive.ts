import { Directive, HostListener, input, output } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appCoverDnd]',
  host: {
    '[class]': 'coverClass',
  },
})
export class CoverDragDirective {
  readonly enableDnd = input(true);
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

      const url = this.extractUrl(evt.dataTransfer);

      if (url) {
        this.coverUrl.emit(url);
      }
    }
  }

  private extractUrl(dt: DataTransfer | null): string | null {
    if (!dt) return null;

    // text/uri-list is set when dragging an image element — gives the image URL directly
    const uriList = dt.getData('text/uri-list');
    if (uriList) {
      const first = uriList
        .split('\n')
        .map((u) => u.trim())
        .find((u) => u && !u.startsWith('#'));
      if (first) return first;
    }

    // text/html is set for rich drags — extract the <img src> (e.g. Google Image Search thumbnails)
    const html = dt.getData('text/html');
    if (html) {
      const match = html.match(/<img[^>]+src="([^"]+)"/);
      if (match) return match[1];
    }

    return dt.getData('text') || null;
  }
}
