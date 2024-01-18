import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  standalone: true,
  imports: [MatToolbarModule, MatIconModule],
  selector: 'app-nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavToolbarComponent {
  @Input()
  showClose = true;

  @Input()
  closeFullWidth = true;

  constructor(private readonly location: Location) {}

  onClose() {
    this.location.back();
  }
}
