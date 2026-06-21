import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MaintenanceStore, UrlMaintenanceService } from '@metal-p3/maintenance/data-access';
import { UrlMatcherComponent, UrlMatcherToolbarComponent } from '@metal-p3/maintenance/ui';
import { tap } from 'rxjs';

@Component({
  imports: [UrlMatcherToolbarComponent, UrlMatcherComponent],
  selector: 'app-url-matcher-shell',
  templateUrl: './url-matcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherShellComponent implements OnInit {
  readonly store = inject(MaintenanceStore);
  private readonly urlMaintenanceService = inject(UrlMaintenanceService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (!this.store.metalArchivesMatcherLoaded()) {
      this.store.getUrlMatcher();
    }

    this.updateProgress();
  }

  updateProgress() {
    this.urlMaintenanceService
      .update()
      .pipe(
        tap((album) => this.store.updateUrlMatcher({ id: album.id, changes: { ...album, complete: true } })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onStartMatching() {
    this.store.startUrlMatcher();
  }

  onStopMatching() {
    this.store.stopUrlMatcher();
  }
}
