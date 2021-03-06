import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { AlbumActions, selectAlbumsSearchRequest } from '@metal-p3/shared/data-access';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';

@UntilDestroy()
@Component({
  selector: 'app-advanced-search-shell',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchShellComponent {
  @Output()
  readonly closeAlbum = new EventEmitter<void>();

  request$ = this.store.select(selectAlbumsSearchRequest);

  constructor(private readonly store: Store) {}

  onSearch(request: SearchRequest): void {
    this.cancelPreviousSearch();
    this.store.dispatch(AlbumActions.loadAlbums({ request }));
  }

  private cancelPreviousSearch() {
    this.store.dispatch(AlbumActions.cancelPreviousSearch({ request: { cancel: true } }));
  }
}
