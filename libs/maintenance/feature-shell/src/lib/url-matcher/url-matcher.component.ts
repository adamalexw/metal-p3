import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  getUrlMatcher,
  selectGettingMetalArchivesMatcher,
  selectMetalArchivesMatcher,
  selectMetalArchivesMatcherLoaded,
  startUrlMatcher,
  stopUrlMatcher,
  updateUrlMatcher,
  UrlMaintenanceService,
} from '@metal-p3/maintenance/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { filter, take, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-url-matcher-shell',
  templateUrl: './url-matcher.component.html',
  styleUrls: ['./url-matcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherShellComponent implements OnInit {
  albums$ = this.store.pipe(select(selectMetalArchivesMatcher));
  matching$ = this.store.pipe(select(selectGettingMetalArchivesMatcher));
  loaded$ = this.store.pipe(select(selectMetalArchivesMatcherLoaded));

  constructor(private readonly store: Store, private urlMaintenanceService: UrlMaintenanceService) {}

  ngOnInit(): void {
    this.loaded$
      .pipe(
        untilDestroyed(this),
        filter((loaded) => !loaded),
        take(1),
        tap(() => this.store.dispatch(getUrlMatcher()))
      )
      .subscribe();

    this.updateProgress();
  }

  updateProgress() {
    this.urlMaintenanceService
      .update()
      .pipe(
        untilDestroyed(this),
        tap((album) => this.store.dispatch(updateUrlMatcher({ update: { id: album.id, changes: { ...album, complete: true } } })))
      )
      .subscribe();
  }

  onStartMatching() {
    this.store.dispatch(startUrlMatcher());
  }

  onStopMatching() {
    this.store.dispatch(stopUrlMatcher());
  }
}
