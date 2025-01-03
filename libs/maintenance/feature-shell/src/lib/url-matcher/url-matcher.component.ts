import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaintenanceActions, UrlMaintenanceService, selectGettingMetalArchivesMatcher, selectMetalArchivesMatcher, selectMetalArchivesMatcherLoaded } from '@metal-p3/maintenance/data-access';
import { UrlMatcherComponent, UrlMatcherToolbarComponent } from '@metal-p3/maintenance/ui';
import { Store } from '@ngrx/store';
import { filter, take, tap } from 'rxjs/operators';

@Component({
  imports: [AsyncPipe, UrlMatcherToolbarComponent, UrlMatcherComponent],
  selector: 'app-url-matcher-shell',
  templateUrl: './url-matcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherShellComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly urlMaintenanceService = inject(UrlMaintenanceService);
  private readonly destroyRef = inject(DestroyRef);

  albums$ = this.store.select(selectMetalArchivesMatcher);
  matching$ = this.store.select(selectGettingMetalArchivesMatcher);
  loaded$ = this.store.select(selectMetalArchivesMatcherLoaded);

  ngOnInit(): void {
    this.loaded$
      .pipe(
        filter((loaded) => !loaded),
        take(1),
        tap(() => this.store.dispatch(MaintenanceActions.getUrlMatcher())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.updateProgress();
  }

  updateProgress() {
    this.urlMaintenanceService
      .update()
      .pipe(
        tap((album) => this.store.dispatch(MaintenanceActions.updateUrlMatcher({ update: { id: album.id, changes: { ...album, complete: true } } }))),
        takeUntilDestroyed(this.destroyRef),
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
