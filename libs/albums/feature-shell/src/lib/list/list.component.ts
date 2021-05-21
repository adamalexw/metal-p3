import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { addNewAlbum, Album, clearCovers, getCover, loadAlbums, selectAlbums, selectAlbumsLoaded, selectAlbumsLoading } from '@metal-p3/albums/data-access';
import { SearchRequest } from '@metal-p3/albums/domain';
import { select, Store } from '@ngrx/store';
import { filter, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  albumsLoading$ = this.store.pipe(select(selectAlbumsLoading));
  albumsLoaded$ = this.store.pipe(select(selectAlbumsLoaded));
  albums$ = this.store.pipe(select(selectAlbums));

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.albumsLoaded$
      .pipe(
        filter((loaded) => !loaded),
        take(1),
        tap(() => this.store.dispatch(loadAlbums({ request: { take: '10' } })))
      )
      .subscribe();
  }

  onGetCover(id: number, folder: string) {
    this.store.dispatch(getCover({ id, folder }));
  }

  identify(index: number, item: Album) {
    return item.id;
  }

  onSearch(request: SearchRequest) {
    this.store.dispatch(clearCovers());
    this.store.dispatch(loadAlbums({ request }));
  }

  onAlbumAdded(folders: string[]) {
    folders.forEach((folder) => this.store.dispatch(addNewAlbum({ folder })));
  }
}
