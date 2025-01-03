import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  imports: [MatToolbarModule, MatIconModule],
  selector: 'app-nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavToolbarComponent {
  private readonly location = inject(Location);

  showClose = input(true);
  closeFullWidth = input(true);

  onClose() {
    this.location.back();
  }
}
