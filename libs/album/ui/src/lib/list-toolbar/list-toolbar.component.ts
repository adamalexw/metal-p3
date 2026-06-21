import { ChangeDetectionStrategy, Component, effect, input, linkedSignal, output, untracked } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { PlaylistDto } from '@metal-p3/playlist/domain';

@Component({
  imports: [FormsModule, MatToolbarModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  selector: 'app-list-toolbar',
  templateUrl: './list-toolbar.component.html',
  styleUrls: ['./list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbarComponent {
  readonly creatingNew = input(false);
  readonly searching = input(false);
  readonly folder = input<string | undefined>('');
  readonly playlists = input<PlaylistDto[]>();

  readonly advancedSearch = output<void>();
  readonly searchRequest = output<SearchRequest>();
  readonly showPlaylists = output<void>();
  readonly loadPlaylist = output<number>();
  readonly createNew = output<void>();
  readonly connectPhone = output<void>();
  readonly lyricsPriority = output<void>();

  protected readonly search = linkedSignal(() => this.folder() ?? '');

  constructor() {
    effect((onCleanup) => {
      const folder = this.search();

      const timeout = setTimeout(() => {
        untracked(() => {
          if (folder !== (this.folder() ?? '')) {
            this.searchRequest.emit({ folder });
          }
        });
      }, 500);

      onCleanup(() => clearTimeout(timeout));
    });
  }

  onSearchInput(value: string) {
    this.search.set(value);
  }

  onClear() {
    this.search.set('');
  }
}
