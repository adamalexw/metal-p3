import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output, ViewChild, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';

@Component({
  standalone: true,
  imports: [ConfirmDeleteDirective, MatTableModule, MatIconModule, MatCheckboxModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  selector: 'app-lyrics-history',
  templateUrl: './lyrics-history.component.html',
  styleUrls: ['./lyrics-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryComponent implements AfterViewInit {
  lyrics = input<LyricsHistoryDto[] | null>([]);

  @Output()
  readonly checked = new EventEmitter<{ id: number; checked: boolean }>();

  @Output()
  readonly applyLyrics = new EventEmitter<{ albumId: number; historyId: number }>();

  @Output()
  readonly deleteHistory = new EventEmitter<number>();

  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['folder', 'url', 'year', 'numTracks', 'numLyrics', 'numLyricsHistory', 'checked', 'complete', 'actions'];
  dataSource = new MatTableDataSource<LyricsHistoryDto>();

  constructor() {
    effect(() => {
      const lyrics = this.lyrics();
      if (lyrics) {
        this.dataSource.data = lyrics;
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.dataSource && !this.dataSource.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  trackByFn(_index: number, item: LyricsHistoryDto) {
    return item.id;
  }

  onChecked(checked: boolean, id: number) {
    this.checked.emit({ id, checked });
  }

  onApply(albumId: number, historyId: number) {
    this.applyLyrics.emit({ albumId, historyId });
  }

  onDelete(result: boolean, id: number) {
    if (result) {
      this.deleteHistory.emit(id);
    }
  }
}
