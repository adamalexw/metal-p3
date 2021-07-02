import { ViewportRuler } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { SearchRequest } from '@metal-p3/album/domain';
import { Track } from '@metal-p3/api-interfaces';
import { PlaylistService, selectPlaylist } from '@metal-p3/player/data-access';
import {
  addNewAlbum,
  Album,
  cancelLoadAlbums,
  clearCovers,
  createNew,
  getCover,
  getTracks,
  loadAlbums,
  renameFolder,
  selectAlbums,
  selectAlbumsLoaded,
  selectAlbumsLoadError,
  selectAlbumsLoading,
  selectCreatingNew,
  selectTracksById,
  selectTracksRequiredById,
  sideNavOpen,
  transferTrack,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { toChunks } from '@metal-p3/shared/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { delay, filter, map, startWith, take, tap } from 'rxjs/operators';

@UntilDestroy()
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

  viewportWidth$ = this.viewportRuler.change().pipe(
    startWith(true),
    map(() => this.viewportRuler.getViewportSize().width)
  );

  albumsView$ = combineLatest([this.albums$, this.viewportWidth$, this.store.select(sideNavOpen)]).pipe(
    filter(([albums, width]) => !!albums && !!width),
    map(([albums, width, open]) => {
      // if the side nav is open we only half the amount of space
      const listWidth = open ? width / 2 : width;
      const chunks = Math.floor(listWidth / 319);

      return toChunks(albums, chunks);
    })
  );

  showPlayer$ = this.store.pipe(select(selectPlaylist)).pipe(map((playlist) => playlist?.length));

  creatingNew$ = this.store.pipe(select(selectCreatingNew));

  private fetchedPages = new Set<number>();
  criteria: string | undefined;

  @Output()
  readonly openAlbum = new EventEmitter<number>();

  constructor(
    private readonly store: Store,
    private readonly router: Router,
    private readonly playlistService: PlaylistService,
    private readonly notificationService: NotificationService,
    private readonly service: AlbumService,
    private readonly viewportRuler: ViewportRuler
  ) {}

  ngOnInit(): void {
    this.albumsLoadError$
      .pipe(
        filter((error) => !!error),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        tap((error) => this.notificationService.showError(error!, 'Load Albums')),
        untilDestroyed(this)
      )
      .subscribe();

    this.service
      .albumAdded()
      .pipe(
        delay(2000),
        tap((folder) => this.onAlbumAdded([folder])),
        untilDestroyed(this)
      )
      .subscribe();
  }

  onGetCover(id: number, folder: string) {
    this.store.dispatch(getCover({ id, folder }));
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
    this.playlistService.playAlbum(id, this.getTracks(id, folder));
  }

  onAddToPlaylist(id: number, folder: string) {
    this.playlistService.addAlbumToPlaylist(id, this.getTracks(id, folder));
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

  trackByFn(index: number, item: Album) {
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

    const initialSize = 40;
    let skip = 0;
    let take = 24;

    if (page === 0) {
      take = initialSize;
    } else {
      skip = initialSize + take * page;
    }

    this.fetchedPages.add(page);
    this.store.dispatch(loadAlbums({ request: { take, skip, criteria } }));
  }
}
