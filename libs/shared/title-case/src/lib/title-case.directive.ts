import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  standalone: true,
  selector: 'input[appTitleCase]',
})
export class TitleCaseDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if ((event.altKey || event.metaKey) && event.key == 't') {
      const input = this.el.nativeElement;
      input.value = this.toTitleCase(input.value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private toTitleCase(value: string) {
    return value.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }
}
