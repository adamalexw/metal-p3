import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  standalone: true,
  selector: 'input[appTitleCase]',
})
export class TitleCaseDirective {
  private ngControl = inject(NgControl);

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if ((event.altKey || event.metaKey) && event.key == 't') {
      if (this.ngControl?.control) {
        this.ngControl.control.setValue(this.toTitleCase(this.ngControl.control.value));
      }
    }
  }

  private toTitleCase(value: string) {
    return value.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
  }
}
