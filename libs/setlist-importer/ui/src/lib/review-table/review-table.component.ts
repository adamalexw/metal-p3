import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ResolvedTrack } from '@metal-p3/setlist-importer/domain';

type StatusFilter = 'all' | 'matched' | 'missing';

@Component({
  imports: [FormsModule, MatCheckboxModule, MatChipsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  selector: 'app-review-table',
  templateUrl: './review-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewTableComponent {
  tracks = input<ResolvedTrack[]>([]);
  matching = input<boolean>(false);
  creating = input<boolean>(false);

  readonly toggleSelection = output<string>();
  readonly setAllSelection = output<boolean>();
  readonly createPlaylist = output<string>();

  readonly filter = signal<StatusFilter>('all');
  readonly playlistName = signal('');

  readonly visible = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.tracks();
    return this.tracks().filter((t) => t.status === f);
  });

  readonly matchedCount = computed(() => this.tracks().filter((t) => t.status === 'matched').length);
  readonly missingCount = computed(() => this.tracks().filter((t) => t.status === 'missing').length);
  readonly selectedCount = computed(() => this.tracks().filter((t) => t.selected).length);

  readonly canCreate = computed(() => this.selectedCount() > 0 && this.playlistName().trim().length > 0 && !this.creating());

  setFilter(filter: StatusFilter) {
    this.filter.set(filter);
  }

  onCreatePlaylist() {
    const name = this.playlistName().trim();
    if (!name || this.selectedCount() === 0) return;
    this.createPlaylist.emit(name);
  }
}
