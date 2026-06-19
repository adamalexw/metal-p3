import { ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MaintenanceStore, LyricsMaintenanceService } from '@metal-p3/maintenance/data-access';
import { LyricsHistoryComponent, LyricsHistoryToolbarComponent } from '@metal-p3/maintenance/ui';
import { tap } from 'rxjs';
import { ApplyLyricsShellComponent } from '../apply-lyrics/apply-lyrics.component';

@Component({
  imports: [LyricsHistoryToolbarComponent, LyricsHistoryComponent, MatDialogModule, ScrollingModule, MatSelectModule],
  selector: 'app-lyrics-history-shell',
  templateUrl: './lyrics-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryShellComponent implements OnInit {
  readonly store = inject(MaintenanceStore);
  private readonly lyricsMaintenanceService = inject(LyricsMaintenanceService);
  private readonly dialog = inject(MatDialog);
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.updateProgress();
  }

  updateProgress() {
    this.lyricsMaintenanceService
      .lyricsHistoryUpdate()
      .pipe(
        tap((lyricsHistory) => this.store.updateLyricsHistory({ id: lyricsHistory.id, changes: { ...lyricsHistory, complete: true } })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.lyricsMaintenanceService
      .lyricsHistoryComplete()
      .pipe(
        tap(() => this.store.stopLyricsHistoryCheck()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onViewPriority() {
    this.store.getLyricsHistory({ priority: true });
  }

  onCheckPriority() {
    this.onViewPriority();
    this.store.checkLyricsHistory({ priority: true });
  }

  onViewCheck() {
    this.store.getLyricsHistory({ priority: false });
  }

  onStartCheck() {
    this.onViewCheck();
    this.store.checkLyricsHistory({ priority: false });
  }

  onStopCheck() {
    this.store.stopLyricsHistoryCheck();
  }

  onChecked(id: number, checked: boolean) {
    this.store.checkedLyricsHistory({ id, checked });
  }

  onApplyLyrics(albumId: number, historyId: number) {
    const dialogRef = this.dialog.open(ApplyLyricsShellComponent, {
      width: `${Math.ceil(this.viewportRuler.getViewportSize().width - 300).toString()}px`,
      data: { albumId, historyId },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: { id: number; apply: boolean } | undefined) => {
        if (result?.apply) {
          this.store.deleteLyricsHistorySuccess(result.id);
        }
      });
  }

  onDeleteHistory(id: number) {
    this.store.deleteLyricsHistory(id);
  }
}
