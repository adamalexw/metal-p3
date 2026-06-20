import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AlbumStore } from '@metal-p3/album/data-access';
import { filter, map } from 'rxjs';
import { AdvancedSearchShellComponent } from '../advanced-search/advanced-search.component';
import { ListComponent } from '../list/list.component';

@Component({
  imports: [RouterModule, MatSidenavModule, ListComponent, AdvancedSearchShellComponent],
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly store = inject(AlbumStore);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  // Router events to detect if a child route is active
  sideNavOpen = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url !== '/')
    ),
    { initialValue: this.router.url !== '/' }
  );

  sideNavMode = toSignal(this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(({ matches }) => (matches ? ('over' as const) : ('side' as const)))), { initialValue: 'side' });

  onCloseAdvancedSearch() {
    this.store.toggleAdvancedSearch();
  }
}

