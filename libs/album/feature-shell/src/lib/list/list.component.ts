import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkVirtualScrollViewport, ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, OnInit, inject, output, viewChild, computed, Injector, signal, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { AlbumStore } from '@metal-p3/album/data-access';
import { ALBUM_DRAWER_WIDTH, TAKE, BASE_PATH } from '@metal-p3/album/domain';
import { ListItemComponent, ListToolbarComponent } from '@metal-p3/album/ui';
import { AlbumDto, SearchRequest } from '@metal-p3/api-interfaces';
import { CoverStore } from '@metal-p3/cover/data-access';
import { PlayerShellComponent } from '@metal-p3/player';
import { PlayerService, PlayerStore } from '@metal-p3/player/data-access';
import { Album } from '@metal-p3/album/domain';
import { NotificationService } from '@metal-p3/shared/feedback';
import { ConnectPhoneService } from '@metal-p3/shared/transfer';
import { nonNullable, toChunks } from '@metal-p3/shared/utils';
import { TrackService } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
import { BehaviorSubject, Observable, combineLatest, debounceTime, delay, filter, from, map, mergeMap, startWith, take, tap } from 'rxjs';
import { AddAlbumDirective } from './add-album.directive';
import { AlbumService } from '@metal-p3/album/data-access';

@Component({
  imports: [ScrollingModule, ListToolbarComponent, ListItemComponent, PlayerShellComponent, AddAlbumDirective],
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  readonly store = inject(AlbumStore);
  private readonly coverStore = inject(CoverStore);
  private readonly trackService = inject(TrackService);
  private readonly router = inject(Router);
  private readonly playerService = inject(PlayerService);
  private readonly playerStore = inject(PlayerStore);
  private readonly notificationService = inject(NotificationService);
  private readonly connectPhoneService = inject(ConnectPhoneService);
  private readonly service = inject(AlbumService);
  private readonly viewportRuler = inject(ViewportRuler);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly take = inject(TAKE);
  private readonly albumDrawerWidth = inject(ALBUM_DRAWER_WIDTH);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly basePath = inject(BASE_PATH);

  private readonly injector = inject(Injector);

  albumsLoading = this.store.loading;
  albumsLoaded = this.store.loaded;
  albumsLoadError = this.store.loadError;
  albums = this.store.albums;
  searchRequest = this.store.searchRequest;
  searchRequestFolder = computed(() => this.store.searchRequest()?.folder);

  creatingNew = computed(() => this.store.creatingNew?.() ?? false);
  readonly coverMap = this.coverStore.entityMap;


  sideNavOpen = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url !== '/'),
    ),
    { initialValue: this.router.url !== '/' }
  );

  viewportWidth = toSignal(
    this.viewportRuler.change().pipe(
      debounceTime(150),
      map(() => this.viewportRuler.getViewportSize().width),
    ),
    { initialValue: this.viewportRuler.getViewportSize().width }
  );

  private readonly isHandset = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(({ matches }) => matches)),
    { initialValue: this.breakpointObserver.isMatched(Breakpoints.Handset) }
  );

  albumsView = computed(() => {
    const albums = this.albums();
    const width = this.viewportWidth();
    const open = this.sideNavOpen();
    const isHandset = this.isHandset();

    // if the side nav is open we remove it's width (desktop/side mode only; on mobile the sidenav overlays)
    const listWidth = open && !isHandset ? width - this.albumDrawerWidth : width;
    const chunks = Math.max(1, Math.floor(listWidth / 275));

    return toChunks(albums, chunks);
  });

  readonly openAlbum = output<number>();

  private fetchedPage = 0;
  private readonly scrollIndex = signal<number>(0);
  private readonly scrollViewport = viewChild.required(CdkVirtualScrollViewport);

  viewportHeight = toSignal(
    this.viewportRuler.change(300).pipe(map(() => this.viewportRuler.getViewportSize().height)),
    { initialValue: this.viewportRuler.getViewportSize().height }
  );

  constructor() {
    effect(() => {
      const error = this.store.loadError?.();
      if (error) this.notificationService.showError(error, 'Load Albums');
    });

    let timeout: any;
    effect(() => {
      const albums = this.albumsView();
      this.scrollIndex(); // tracking dependency

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.loadVisibleCovers(albums);
      }, 100);
    });

    effect(() => {
      const playerOpen = this.playerStore.showPlayer();
      const height = this.viewportHeight();
      const loading = this.albumsLoading();

      const listHeight = playerOpen ? height - 128 : height - 64;
      const finalHeight = loading ? listHeight - 12 : listHeight;

      this.document.documentElement.style.setProperty('--list-height', `${finalHeight}px`);
    });
  }

  ngOnInit(): void {

    this.service
      .albumAdded()
      .pipe(tap((album) => this.onAlbumAdded(album)))
      .subscribe();
  }

  private loadVisibleCovers(albums: Album[][]): void {
    const { start, end } = this.scrollViewport().getRenderedRange();
    const rendered = albums.slice(start, end).flat();
    const coverRequests = rendered
      .filter((a) => {
        const coverState = this.coverMap()[a.id];
        return !a.cover && !coverState?.cover && !coverState?.loading && !coverState?.error;
      })
      .map((a) => ({ id: a.id, folder: a.folder }));
      
    if (coverRequests.length > 0) {
      this.coverStore.getMany({ requests: coverRequests });
    }
  }

  onDeleteAlbum(id: number) {
    this.store.deleteAlbum(id);
  }

  onTransferAlbum(id: number, folder: string) {
    const tracks$ = this.getTracks(id, folder);

    tracks$
      .pipe(
        tap((tracks) => {
          tracks?.forEach((track) => this.trackService.transferTrack(track.fullPath).subscribe());
          this.store.setTransferred({ id, transferred: true });
        }),
        take(1),
      )
      .subscribe();
  }

  onPlayAlbum(id: number, folder: string) {
    this.getTracks(id, folder).subscribe(tracks => {
      this.playerService.playAlbum(id, tracks);
    });
  }

  onAddToPlaylist(id: number, folder: string) {
    this.getTracks(id, folder).subscribe(tracks => {
      this.playerService.addAlbumToPlaylist(id, tracks);
    });
  }

  private getTracks(id: number, folder: string): Observable<Track[] | undefined> {
    return this.trackService.getTracks(`${this.basePath}/${folder}`).pipe(take(1));
  }

  trackByVirtualFn(index: number): number {
    return index;
  }

  trackByAlbumFn(_index: number, item: Album): number {
    return item.id;
  }

  onAdvancedSearch() {
    this.store.toggleAdvancedSearch();
  }

  onSearch(request: SearchRequest) {
    this.fetchedPage = 0;
    this.store.loadAlbums({ request: { skip: 0, take: 0 }, cancel: true });
    this.scrollIndexChange(0, request, true);

    if (this.sideNavOpen()) {
      setTimeout(() => this.location.back(), 100);
    }
  }

  onAlbumAdded(albumDto: AlbumDto) {
    const album: Album = { ...albumDto };
    this.store.addAlbum(album);
  }

  onFoldersDropped(folders: string[]) {
    from(folders)
      .pipe(
        mergeMap((folder) => this.service.addNewAlbum(folder)),
        tap((albumDto) => this.onAlbumAdded(albumDto)),
      )
      .subscribe();
  }

  onShowPlayer() {
    this.playerStore.show();
  }

  onCreateNew() {
    this.store.createNew();
  }

  onOpenAlbum(id: number) {
    this.store.viewAlbum(id);
    this.router.navigate(['album', id]);
  }

  onConnectPhone() {
    this.connectPhoneService.showConnectPhone();
  }

  scrollIndexChange(page: number, request: SearchRequest, force: boolean) {
    this.scrollIndex.set(page);

    if (!force && this.scrollViewport().getRenderedRange().end !== this.scrollViewport().getDataLength()) {
      return;
    }

    const initialSize = this.take;
    let skip = 0;
    let take = 65;

    switch (page) {
      case 0:
        take = initialSize;
        break;
      case 1:
        skip = initialSize;
        break;
      default:
        skip = initialSize + take * (this.fetchedPage - 1);
    }

    this.fetchedPage += 1;
    this.store.loadAlbums({ request: { ...request, take, skip } });
  }
}

