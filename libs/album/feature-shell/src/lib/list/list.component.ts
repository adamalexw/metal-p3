import { ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { AsyncPipe, DOCUMENT, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { TAKE } from '@metal-p3/album/domain';
import { ListItemComponent, ListToolbarComponent } from '@metal-p3/album/ui';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { PlayerShellComponent } from '@metal-p3/player';
import { PlayerActions, PlayerService, selectShowPlayer } from '@metal-p3/player/data-access';
import {
  Album,
  AlbumActions,
  selectAlbums,
  selectAlbumsLoaded,
  selectAlbumsLoadError,
  selectAlbumsLoading,
  selectAlbumsSearchRequest,
  selectAlbumsSearchRequestFolder,
  selectCreatingNew,
  selectSideNavOpen,
  selectTracksById,
  selectTracksRequiredById,
  TrackActions,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { nonNullable, toChunks } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { delay, filter, map, startWith, take, tap } from 'rxjs/operators';
import { AddAlbumDirective } from './add-album.directive';

@Component({
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, ScrollingModule, ListToolbarComponent, ListItemComponent, PlayerShellComponent, AddAlbumDirective],
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  albumsLoading$ = this.store.select(selectAlbumsLoading);
  albumsLoaded$ = this.store.select(selectAlbumsLoaded);
  albumsLoadError$ = this.store.select(selectAlbumsLoadError);
  albums$ = this.store.select(selectAlbums);
  searchRequest$ = this.store.select(selectAlbumsSearchRequest);
  searchRequestFolder$ = this.store.select(selectAlbumsSearchRequestFolder);
  showPlayer$ = this.store.select(selectShowPlayer);
  creatingNew$ = this.store.select(selectCreatingNew);
  sideNavOpen$ = this.store.select(selectSideNavOpen);

  viewportWidth$ = this.viewportRuler.change().pipe(
    startWith(this.viewportRuler.getViewportSize().width),
    map(() => this.viewportRuler.getViewportSize().width)
  );

  albumsView$ = combineLatest([this.albums$, this.viewportWidth$, this.store.select(selectSideNavOpen)]).pipe(
    filter(([albums, width]) => !!albums && !!width),
    map(([albums, width, open]) => {
      // if the side nav is open we remove it's width
      const listWidth = open ? width - 1130 : width;
      const chunks = Math.floor(listWidth / 272);

      return toChunks(albums, chunks);
    })
  );

  private fetchedPages = new Set<number>();

  @Output()
  readonly openAlbum = new EventEmitter<number>();

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly playerService: PlayerService,
    private readonly notificationService: NotificationService,
    private readonly service: AlbumService,
    private readonly viewportRuler: ViewportRuler,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(TAKE) private readonly take: number
  ) {}

  ngOnInit(): void {
    this.albumsLoadError$
      .pipe(
        nonNullable(),
        tap((error) => this.notificationService.showError(error, 'Load Albums'))
      )
      .subscribe();

    this.service
      .albumAdded()
      .pipe(
        delay(2000),
        tap((folder) => this.onAlbumAdded([folder]))
      )
      .subscribe();

    combineLatest([
      this.showPlayer$,
      this.viewportRuler.change(300).pipe(
        map(() => this.viewportRuler.getViewportSize().height),
        startWith(this.viewportRuler.getViewportSize().height)
      ),
      this.albumsLoading$,
    ])
      .pipe(
        map(([playerOpen, height, loading]) => {
          const listHeight = playerOpen ? height - 128 : height - 64;

          return loading ? listHeight - 12 : listHeight;
        })
      )
      .subscribe((height) => this.document.documentElement.style.setProperty('--list-height', height.toString() + 'px'));
  }

  onRenameFolder(id: number, src: string, artist: string, album: string) {
    this.store.dispatch(AlbumActions.renameFolder({ id, src, artist, album }));
  }

  onTransferAlbum(id: number, folder: string) {
    const tracks$ = this.getTracks(id, folder);

    tracks$
      .pipe(
        tap((tracks) => tracks?.forEach((track) => this.store.dispatch(TrackActions.transferTrack({ id, trackId: track.id })))),
        take(1)
      )
      .subscribe();
  }

  onPlayAlbum(id: number, folder: string) {
    this.playerService.playAlbum(id, this.getTracks(id, folder));
  }

  onAddToPlaylist(id: number, folder: string) {
    this.playerService.addAlbumToPlaylist(id, this.getTracks(id, folder));
  }

  private getTracks(id: number, folder: string): Observable<Track[] | undefined> {
    this.store
      .select(selectTracksRequiredById(id))
      .pipe(
        take(1),
        filter((required) => !!required),
        tap(() => this.store.dispatch(TrackActions.getTracks({ id, folder })))
      )
      .subscribe();

    return this.store.select(selectTracksById(id)).pipe(filter((tracks) => !!tracks));
  }

  trackByVirtualFn(index: number): number {
    return index;
  }

  trackByAlbumFn(_index: number, item: Album): number {
    return item.id;
  }

  onAdvancedSearch() {
    this.store.dispatch(AlbumActions.advancedSearch());
  }

  onSearch(request: SearchRequest) {
    this.fetchedPages.clear();
    this.store.dispatch(AlbumActions.cancelPreviousSearch({ request: { cancel: true } }));
    this.scrollIndexChange(0, request);
  }

  onAlbumAdded(folders: string[]) {
    folders.forEach((folder) => this.store.dispatch(AlbumActions.addNewAlbum({ folder })));
  }

  onShowPlayer() {
    this.store.dispatch(PlayerActions.show());
  }

  onCreateNew() {
    this.store.dispatch(AlbumActions.createNew());
  }

  onOpenAlbum(id: number) {
    this.store.dispatch(AlbumActions.viewAlbum({ id }));
    this.router.navigate(['album', id]);
  }

  scrollIndexChange(page: number, request: SearchRequest) {
    if (this.fetchedPages.has(page)) {
      return;
    }

    const initialSize = this.take;
    let skip = 0;
    let take = 36;

    switch (page) {
      case 0:
        take = initialSize;
        break;
      case 1:
        skip = initialSize;
        break;
      default:
        skip = initialSize + take * (page - 1);
    }

    this.fetchedPages.add(page);
    this.store.dispatch(AlbumActions.loadAlbums({ request: { ...request, take, skip } }));
  }
}
