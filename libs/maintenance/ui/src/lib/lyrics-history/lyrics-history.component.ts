import { ChangeDetectionStrategy, Component, effect, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';

@Component({
  standalone: true,
  imports: [ConfirmDeleteDirective, MatTableModule, MatIconModule, MatCheckboxModule, MatButtonModule, MatMenuModule, MatSortModule, MatTooltipModule],
  selector: 'app-lyrics-history',
  templateUrl: './lyrics-history.component.html',
  styleUrls: ['./lyrics-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsHistoryComponent {
  lyrics = input<LyricsHistoryDto[] | null>([]);

  readonly checked = output<{
    id: number;
    checked: boolean;
  }>();

  readonly applyLyrics = output<{
    albumId: number;
    historyId: number;
  }>();

  readonly deleteHistory = output<number>();

  private readonly sort = viewChild.required(MatSort);

  displayedColumns = ['folder', 'url', 'year', 'numTracks', 'numLyrics', 'numLyricsHistory', 'checked', 'complete', 'actions'];
  dataSource = new MatTableDataSource<LyricsHistoryDto>();

  constructor() {
    effect(
      () => {
        const lyrics = this.lyrics();

        if (lyrics?.length) {
          this.dataSource.data = lyrics;
        }
      },
      { allowSignalWrites: true }, // TODO why
    );

    effect(() => {
      const sort = this.sort();

      this.dataSource.sort = sort;
    });
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
