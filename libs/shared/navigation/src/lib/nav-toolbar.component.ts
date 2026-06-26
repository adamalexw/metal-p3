import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  selector: 'app-nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavToolbarComponent {
  private readonly location = inject(Location);

  readonly showClose = input(true);
  readonly closeFullWidth = input(true);
  readonly transparent = input(false);

  onClose() {
    this.location.back();
  }
}
