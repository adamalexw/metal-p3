import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  styleUrls: ['./nav-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavToolbarComponent {
  @Input()
  showClose = true;

  @Input()
  closeFullWidth = true;

  constructor(private location: Location) {}

  onClose() {
    this.location.back();
  }
}
