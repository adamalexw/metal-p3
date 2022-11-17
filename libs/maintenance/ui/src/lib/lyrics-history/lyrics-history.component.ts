import { NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
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
  imports: [NgIf, ConfirmDeleteDirective, MatTableModule, MatIconModule, MatCheckboxModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  selector: 'app-lyrics-history',
  templateUrl: './lyrics-history.component.html',
  styleUrls: ['./lyrics-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryComponent implements OnChanges, AfterViewInit {
  @Input()
  lyrics: LyricsHistoryDto[] | null = [];

  @Output()
  readonly checked = new EventEmitter<{ id: number; checked: boolean }>();

  @Output()
  readonly applyLyrics = new EventEmitter<{ albumId: number; historyId: number }>();

  @Output()
  readonly deleteHistory = new EventEmitter<number>();

  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['folder', 'url', 'year', 'numTracks', 'numLyrics', 'numLyricsHistory', 'checked', 'complete', 'actions'];
  dataSource: MatTableDataSource<LyricsHistoryDto> = new MatTableDataSource();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.lyrics && this.lyrics) {
      this.dataSource = new MatTableDataSource(this.lyrics);
      this.dataSource.sort = this.sort;
    }
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
