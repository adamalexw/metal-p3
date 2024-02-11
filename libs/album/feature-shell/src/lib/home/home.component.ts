import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild, inject } from '@angular/core';
import { MatDrawerMode, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AlbumActions, selectAdvancedSearchOpen, selectSideNavOpen } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import { AdvancedSearchShellComponent } from '../advanced-search/advanced-search.component';
import { ListComponent } from '../list/list.component';

@Component({
  standalone: true,
  imports: [AsyncPipe, RouterModule, MatSidenavModule, ListComponent, AdvancedSearchShellComponent],
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly store = inject(Store);
  private readonly breakpointObserver = inject(BreakpointObserver);

  @ViewChild('searchnav') searchNav!: MatSidenav;
  @ViewChild('sidenav') sideNav!: MatSidenav;

  avancedSearchOpen$ = this.store.select(selectAdvancedSearchOpen);
  sideNavOpen$ = this.store.select(selectSideNavOpen);
  sideNavMode$: Observable<MatDrawerMode> = this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(({ matches }) => (matches ? 'over' : 'side')));

  onCloseAdvancedSearch() {
    this.store.dispatch(AlbumActions.advancedSearch());
  }
}
