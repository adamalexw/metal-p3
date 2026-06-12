import { ChangeDetectionStrategy, Component, input, linkedSignal, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { Subject, debounceTime, distinctUntilChanged, tap } from 'rxjs';

@Component({
  imports: [FormsModule, MatToolbarModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  selector: 'app-list-toolbar',
  templateUrl: './list-toolbar.component.html',
  styleUrls: ['./list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbarComponent {
  creatingNew = input<boolean | null | undefined>(false);
  searching = input<boolean | null | undefined>(false);
  folder = input<string | null | undefined>('');

  readonly advancedSearch = output<void>();
  readonly searchRequest = output<SearchRequest>();
  readonly showPlayer = output<void>();
  readonly createNew = output<void>();
  readonly connectPhone = output<void>();
  readonly lyricsPriority = output<void>();

  protected readonly search = linkedSignal(() => this.folder() ?? '');

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((folder) => this.searchRequest.emit({ folder })),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  onSearchInput(value: string) {
    this.search.set(value);
    this.searchInput$.next(value);
  }

  onClear() {
    this.search.set('');
    this.searchInput$.next('');
  }
}
