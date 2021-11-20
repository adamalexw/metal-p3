import { ViewportRuler } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { SearchRequest } from '@metal-p3/album/domain';
import { PlayerService, selectPlaylist, showPlayer } from '@metal-p3/player/data-access';
import {
  addNewAlbum,
  Album,
  cancelLoadAlbums,
  clearCovers,
  createNew,
  getTracks,
  loadAlbums,
  renameFolder,
  selectAlbums,
  selectAlbumsLoaded,
  selectAlbumsLoadError,
  selectAlbumsLoading,
  selectAlbumsSearchCriteria,
  selectCreatingNew,
  selectTracksById,
  selectTracksRequiredById,
  sideNavOpen,
  transferTrack,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { nonNullable, toChunks } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { delay, filter, map, startWith, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  albumsLoading$ = this.store.pipe(select(selectAlbumsLoading));
  albumsLoaded$ = this.store.pipe(select(selectAlbumsLoaded));
  albumsLoadError$ = this.store.pipe(select(selectAlbumsLoadError));
  albums$ = this.store.pipe(select(selectAlbums));
  criteria$ = this.store.pipe(select(selectAlbumsSearchCriteria));
  showPlayer$ = this.store.pipe(select(selectPlaylist)).pipe(map((playlist) => playlist?.length));
  creatingNew$ = this.store.pipe(select(selectCreatingNew));

  viewportWidth$ = this.viewportRuler.change().pipe(
    startWith(this.viewportRuler.getViewportSize().width),
    map(() => this.viewportRuler.getViewportSize().width)
  );

  albumsView$ = combineLatest([this.albums$, this.viewportWidth$, this.store.select(sideNavOpen)]).pipe(
    filter(([albums, width]) => !!albums && !!width),
    map(([albums, width, open]) => {
      // if the side nav is open we remove it's width
      const listWidth = open ? width - 1130 : width;
      const chunks = Math.floor(listWidth / 272);

      return toChunks(albums, chunks);
    })
  );

  private fetchedPages = new Set<number>();
  criteria: string | undefined;

  @Output()
  readonly openAlbum = new EventEmitter<number>();

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly playerService: PlayerService,
    private readonly notificationService: NotificationService,
    private readonly service: AlbumService,
    private readonly viewportRuler: ViewportRuler
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
  }

  onRenameFolder(id: number, src: string, artist: string, album: string) {
    this.store.dispatch(renameFolder({ id, src, artist, album }));
  }

  onTransferAlbum(id: number, folder: string) {
    const tracks$ = this.getTracks(id, folder);

    tracks$
      .pipe(
        tap((tracks) => tracks?.forEach((track) => this.store.dispatch(transferTrack({ id, trackId: track.id })))),
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
      .pipe(select(selectTracksRequiredById(id)))
      .pipe(
        take(1),
        filter((required) => !!required),
        tap(() => this.store.dispatch(getTracks({ id, folder })))
      )
      .subscribe();

    return this.store.pipe(
      select(selectTracksById(id)),
      filter((tracks) => !!tracks)
    );
  }

  trackByVirtualFn(index: number): number {
    return index;
  }

  trackByAlbumFn(_index: number, item: Album): number {
    return item.id;
  }

  onSearch(request: SearchRequest) {
    this.fetchedPages.clear();
    this.store.dispatch(clearCovers());
    this.store.dispatch(cancelLoadAlbums({ request: { cancel: true } }));
    this.criteria = request.criteria;
    this.scrollIndexChange(0, this.criteria);
  }

  onAlbumAdded(folders: string[]) {
    folders.forEach((folder) => this.store.dispatch(addNewAlbum({ folder })));
  }

  onShowPlayer() {
    this.store.dispatch(showPlayer());
  }

  onCreateNew() {
    this.store.dispatch(createNew());
  }

  onOpenAlbum(id: number) {
    this.store.dispatch(viewAlbum({ id }));
    this.router.navigate(['album', id]);
  }

  scrollIndexChange(page: number, criteria: string | undefined) {
    if (this.fetchedPages.has(page)) {
      return;
    }

    const initialSize = 60;
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
    this.store.dispatch(loadAlbums({ request: { take, skip, criteria } }));
  }
}
