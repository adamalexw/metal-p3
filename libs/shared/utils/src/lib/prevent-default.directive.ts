import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'form',
})
export class PreventDefaultDirective {
  @HostListener('submit', ['$event'])
  onSubmit(event: Event): void {
    event.preventDefault();
  }
}
