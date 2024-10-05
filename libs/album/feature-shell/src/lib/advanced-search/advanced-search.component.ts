import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdvancedSearchFormComponent } from '@metal-p3/album/ui';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { AlbumActions, selectAlbumsSearchRequest } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';

@Component({
  standalone: true,
  imports: [AsyncPipe, AdvancedSearchFormComponent],
  selector: 'app-advanced-search-shell',
  templateUrl: './advanced-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchShellComponent {
  private readonly store = inject(Store);
  request$ = this.store.select(selectAlbumsSearchRequest);

  onSearch(request: SearchRequest): void {
    this.cancelPreviousSearch();
    this.store.dispatch(AlbumActions.loadAlbums({ request }));
  }

  private cancelPreviousSearch() {
    this.store.dispatch(AlbumActions.cancelPreviousSearch({ request: { cancel: true } }));
  }
}
