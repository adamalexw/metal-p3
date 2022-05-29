import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { AlbumActions, selectAdvancedSearchOpen, selectSideNavOpen } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  @ViewChild('searchnav') searchNav!: MatSidenav;
  @ViewChild('sidenav') sideNav!: MatSidenav;

  avancedSearchOpen$ = this.store.select(selectAdvancedSearchOpen);
  sideNavOpen$ = this.store.select(selectSideNavOpen);

  constructor(private readonly store: Store) {}

  onCloseAdvancedSearch() {
    this.store.dispatch(AlbumActions.advancedSearch());
  }
}
