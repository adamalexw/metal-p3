import { ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { LyricsMaintenanceService, MaintenanceActions, selectCheckingLyrics, selectGettingLyrics, selectLyrics } from '@metal-p3/maintenance/data-access';
import { LyricsHistoryComponent, LyricsHistoryToolbarComponent } from '@metal-p3/maintenance/ui';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { ApplyLyricsShellComponent } from '../apply-lyrics/apply-lyrics.component';

@UntilDestroy()
@Component({
  standalone: true,
  imports: [AsyncPipe, LyricsHistoryToolbarComponent, LyricsHistoryComponent, MatDialogModule, ScrollingModule, MatSelectModule],
  selector: 'app-lyrics-history-shell',
  templateUrl: './lyrics-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryShellComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly lyricsMaintenanceService = inject(LyricsMaintenanceService);
  private readonly dialog = inject(MatDialog);
  private readonly viewportRuler = inject(ViewportRuler);

  getting$ = this.store.select(selectGettingLyrics);
  checking$ = this.store.select(selectCheckingLyrics);
  lyrics$ = this.store.select(selectLyrics);

  ngOnInit(): void {
    this.updateProgress();
  }

  updateProgress() {
    this.lyricsMaintenanceService
      .lyricsHistoryUpdate()
      .pipe(
        untilDestroyed(this),
        tap((lyricsHistory) => this.store.dispatch(MaintenanceActions.updateLyricsHistory({ update: { id: lyricsHistory.id, changes: { ...lyricsHistory, complete: true } } }))),
      )
      .subscribe();

    this.lyricsMaintenanceService
      .lyricsHistoryComplete()
      .pipe(
        untilDestroyed(this),
        tap(() => this.store.dispatch(MaintenanceActions.stopLyricsHistoryCheck())),
      )
      .subscribe();
  }

  onViewPriority() {
    this.store.dispatch(MaintenanceActions.getLyricsHistory({ priority: true }));
  }

  onCheckPriority() {
    this.onViewPriority();
    this.store.dispatch(MaintenanceActions.checkLyricsHistory({ priority: true }));
  }

  onViewCheck() {
    this.store.dispatch(MaintenanceActions.getLyricsHistory({ priority: false }));
  }

  onStartCheck() {
    this.onViewCheck();
    this.store.dispatch(MaintenanceActions.checkLyricsHistory({ priority: false }));
  }

  onStopCheck() {
    this.store.dispatch(MaintenanceActions.stopLyricsHistoryCheck());
  }

  onChecked(id: number, checked: boolean) {
    this.store.dispatch(MaintenanceActions.checkedLyricsHistory({ id, checked }));
  }

  onApplyLyrics(albumId: number, historyId: number) {
    const dialogRef = this.dialog.open(ApplyLyricsShellComponent, {
      width: `${Math.ceil(this.viewportRuler.getViewportSize().width - 300).toString()}px`,
      data: { albumId, historyId },
    });

    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result: { id: number; apply: boolean } | undefined) => {
        if (result?.apply) {
          this.store.dispatch(MaintenanceActions.deleteLyricsHistorySuccess({ id: result.id }));
        }
      });
  }

  onDeleteHistory(id: number) {
    this.store.dispatch(MaintenanceActions.deleteLyricsHistory({ id }));
  }
}
