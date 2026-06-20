import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumStore } from '@metal-p3/album/data-access';
import { AdvancedSearchFormComponent } from '@metal-p3/album/ui';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { CoverStore } from '@metal-p3/cover/data-access';

@Component({
  imports: [AdvancedSearchFormComponent],
  selector: 'app-advanced-search-shell',
  templateUrl: './advanced-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchShellComponent {
  readonly store = inject(AlbumStore);
  private readonly coverStore = inject(CoverStore);

  onSearch(request: SearchRequest): void {
    this.cancelPreviousSearch();
    this.store.loadAlbums({ request });
  }

  private cancelPreviousSearch() {
    this.store.loadAlbums({ request: { skip: 0, take: 0 }, cancel: true });
    this.coverStore.getMany({ requests: [], cancel: true });
  }
}

