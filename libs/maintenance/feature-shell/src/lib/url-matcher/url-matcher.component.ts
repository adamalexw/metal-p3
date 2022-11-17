import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MaintenanceActions, selectGettingMetalArchivesMatcher, selectMetalArchivesMatcher, selectMetalArchivesMatcherLoaded, UrlMaintenanceService } from '@metal-p3/maintenance/data-access';
import { UrlMatcherComponent, UrlMatcherToolbarComponent } from '@metal-p3/maintenance/ui';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  standalone: true,
  imports: [AsyncPipe, UrlMatcherToolbarComponent, UrlMatcherComponent],
  selector: 'app-url-matcher-shell',
  templateUrl: './url-matcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherShellComponent implements OnInit {
  albums$ = this.store.select(selectMetalArchivesMatcher);
  matching$ = this.store.select(selectGettingMetalArchivesMatcher);
  loaded$ = this.store.select(selectMetalArchivesMatcherLoaded);

  constructor(private readonly store: Store, private urlMaintenanceService: UrlMaintenanceService) {}

  ngOnInit(): void {
    this.loaded$
      .pipe(
        untilDestroyed(this),
        filter((loaded) => !loaded),
        take(1),
        tap(() => this.store.dispatch(MaintenanceActions.getUrlMatcher()))
      )
      .subscribe();

    this.updateProgress();
  }

  updateProgress() {
    this.urlMaintenanceService
      .update()
      .pipe(
        untilDestroyed(this),
        tap((album) => this.store.dispatch(MaintenanceActions.updateUrlMatcher({ update: { id: album.id, changes: { ...album, complete: true } } })))
      )
      .subscribe();
  }

  onStartMatching() {
    this.store.dispatch(MaintenanceActions.startUrlMatcher());
  }

  onStopMatching() {
    this.store.dispatch(MaintenanceActions.stopUrlMatcher());
  }
}
