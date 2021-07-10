import { ViewportRuler } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  checkedLyricsHistory,
  checkLyricsHistory,
  deleteLyricsHistory,
  deleteLyricsHistorySuccess,
  getLyricsHistory,
  LyricsMaintenanceService,
  selectCheckingLyrics,
  selectGettingLyrics,
  selectLyrics,
  stopLyricsCheck,
  updateLyricsHistory,
} from '@metal-p3/maintenance/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { tap } from 'rxjs/operators';
import { ApplyLyricsShellComponent } from '../apply-lyrics/apply-lyrics.component';

@UntilDestroy()
@Component({
  selector: 'app-lyrics-history-shell',
  templateUrl: './lyrics-history.component.html',
  styleUrls: ['./lyrics-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryShellComponent implements OnInit {
  getting$ = this.store.pipe(select(selectGettingLyrics));
  checking$ = this.store.pipe(select(selectCheckingLyrics));
  lyrics$ = this.store.pipe(select(selectLyrics));

  constructor(private readonly store: Store, private readonly lyricsMaintenanceService: LyricsMaintenanceService, private readonly dialog: MatDialog, private readonly viewportRuler: ViewportRuler) {}

  ngOnInit(): void {
    this.updateProgress();
  }

  updateProgress() {
    this.lyricsMaintenanceService
      .lyricsHistoryUpdate()
      .pipe(
        untilDestroyed(this),
        tap((lyricsHistory) => this.store.dispatch(updateLyricsHistory({ update: { id: lyricsHistory.id, changes: { ...lyricsHistory, complete: true } } })))
      )
      .subscribe();

    this.lyricsMaintenanceService
      .lyricsHistoryComplete()
      .pipe(
        untilDestroyed(this),
        tap(() => this.store.dispatch(stopLyricsCheck()))
      )
      .subscribe();
  }

  onViewPriority() {
    this.store.dispatch(getLyricsHistory({ priority: true }));
  }

  onCheckPriority() {
    this.onViewPriority();
    this.store.dispatch(checkLyricsHistory({ priority: true }));
  }

  onViewCheck() {
    this.store.dispatch(getLyricsHistory({ priority: false }));
  }

  onStartCheck() {
    this.onViewCheck();
    this.store.dispatch(checkLyricsHistory({ priority: false }));
  }

  onStopCheck() {
    this.store.dispatch(stopLyricsCheck());
  }

  onChecked(id: number, checked: boolean) {
    this.store.dispatch(checkedLyricsHistory({ id, checked }));
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
          this.store.dispatch(deleteLyricsHistorySuccess({ id: result.id }));
        }
      });
  }

  onDeleteHistory(id: number) {
    this.store.dispatch(deleteLyricsHistory({ id }));
  }
}
