import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { sideNavOpen } from '@metal-p3/shared/data-access';
import { select, Store } from '@ngrx/store';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  @ViewChild('sidenav') sideNav!: MatSidenav;

  sideNavOpen$ = this.store.pipe(select(sideNavOpen));

  constructor(private store: Store) {}
}
