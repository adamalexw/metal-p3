import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AlbumActions, selectAdvancedSearchOpen, selectSideNavOpen } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
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

  avancedSearchOpen$ = this.store.select(selectAdvancedSearchOpen);
  sideNavOpen$ = this.store.select(selectSideNavOpen);
  sideNavMode = toSignal(this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(({ matches }) => (matches ? ('over' as const) : ('side' as const)))), { initialValue: 'side' });

  onCloseAdvancedSearch() {
    this.store.dispatch(AlbumActions.advancedSearch());
  }
}
