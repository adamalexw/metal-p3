import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CdkVirtualScrollViewport, ScrollingModule, ViewportRuler } from '@angular/cdk/scrolling';
import { AsyncPipe, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, OnInit, inject, output, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { ALBUM_DRAWER_WIDTH, TAKE } from '@metal-p3/album/domain';
import { ListItemComponent, ListToolbarComponent } from '@metal-p3/album/ui';
import { AlbumDto, SearchRequest } from '@metal-p3/api-interfaces';
import { PlayerShellComponent } from '@metal-p3/player';
import { PlayerStore, PlayerService } from '@metal-p3/player/data-access';
import {

  Album,
  AlbumActions,
  CoverActions,
  TrackActions,
  selectAlbums,
  selectAlbumsLoadError,
  selectAlbumsLoaded,
  selectAlbumsLoading,
  selectAlbumsSearchRequest,
  selectAlbumsSearchRequestFolder,
  selectCreatingNew,
  selectSideNavOpen,
  selectTracksById,
  selectTracksRequiredById,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { ConnectPhoneService } from '@metal-p3/shared/transfer';
import { nonNullable, toChunks } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, combineLatest, debounceTime, delay, filter, from, map, mergeMap, startWith, take, tap } from 'rxjs';
import { AddAlbumDirective } from './add-album.directive';

@Component({
  imports: [AsyncPipe, ScrollingModule, ListToolbarComponent, ListItemComponent, PlayerShellComponent, AddAlbumDirective],
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent implements OnInit {
  private readonly store = inject(Store);
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

  albumsLoading$ = this.store.select(selectAlbumsLoading);
  albumsLoaded$ = this.store.select(selectAlbumsLoaded);
  albumsLoadError$ = this.store.select(selectAlbumsLoadError);
  albums$ = this.store.select(selectAlbums);
  searchRequest$ = this.store.select(selectAlbumsSearchRequest);
  searchRequestFolder$ = this.store.select(selectAlbumsSearchRequestFolder);
  showPlayer$ = toObservable(this.playerStore.showPlayer);
  creatingNew$ = this.store.select(selectCreatingNew);
  sideNavOpen$ = this.store.select(selectSideNavOpen);

  viewportWidth$ = this.viewportRuler.change().pipe(
    debounceTime(150),
    startWith(this.viewportRuler.getViewportSize().width),
    map(() => this.viewportRuler.getViewportSize().width),
  );

  private readonly isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map(({ matches }) => matches));

  albumsView$ = combineLatest([this.albums$, this.viewportWidth$, this.store.select(selectSideNavOpen), this.isHandset$]).pipe(
    map(([albums, width, open, isHandset]) => {
      // if the side nav is open we remove it's width (desktop/side mode only; on mobile the sidenav overlays)
      const listWidth = open && !isHandset ? width - this.albumDrawerWidth : width;
      const chunks = Math.max(1, Math.floor(listWidth / 275));

      return toChunks(albums, chunks);
    }),
  );

  readonly openAlbum = output<number>();

  private fetchedPage = 0;
  private readonly scrollIndex$ = new BehaviorSubject<number>(0);
  private readonly scrollViewport = viewChild.required(CdkVirtualScrollViewport);

  ngOnInit(): void {
    this.albumsLoadError$
      .pipe(
        nonNullable(),
        tap((error) => this.notificationService.showError(error, 'Load Albums')),
      )
      .subscribe();

    this.service
      .albumAdded()
      .pipe(tap((album) => this.onAlbumAdded(album)))
      .subscribe();

    combineLatest([this.albumsView$, this.scrollIndex$])
      .pipe(
        debounceTime(100),
        tap(([albums]) => this.loadVisibleCovers(albums)),
      )
      .subscribe();

    combineLatest([
      this.showPlayer$,
      this.viewportRuler.change(300).pipe(
        map(() => this.viewportRuler.getViewportSize().height),
        startWith(this.viewportRuler.getViewportSize().height),
      ),
      this.albumsLoading$,
    ])
      .pipe(
        map(([playerOpen, height, loading]) => {
          const listHeight = playerOpen ? height - 128 : height - 64;

          return loading ? listHeight - 12 : listHeight;
        }),
      )
      .subscribe((height) => this.document.documentElement.style.setProperty('--list-height', height.toString() + 'px'));
  }

  private loadVisibleCovers(albums: Album[][]): void {
    const { start, end } = this.scrollViewport().getRenderedRange();
    const rendered = albums.slice(start, end).flat();
    rendered.filter((a) => !a.cover && !a.coverLoading && !a.coverError).forEach((a) => this.store.dispatch(CoverActions.get({ id: a.id, folder: a.folder })));
  }

  onDeleteAlbum(id: number) {
    this.store.dispatch(AlbumActions.deleteAlbum({ id }));
  }

  onTransferAlbum(id: number, folder: string) {
    const tracks$ = this.getTracks(id, folder);

    tracks$
      .pipe(
        tap((tracks) => {
          tracks?.forEach((track) => this.store.dispatch(TrackActions.transferTrack({ id, trackId: track.id })));
          this.store.dispatch(AlbumActions.setTransferred({ id, transferred: true }));
        }),
        take(1),
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
        tap(() => this.store.dispatch(TrackActions.getTracks({ id, folder }))),
      )
      .subscribe();

    return this.store.select(selectTracksById(id)).pipe(filter((tracks) => !!tracks?.length));
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
    this.fetchedPage = 0;
    this.store.dispatch(AlbumActions.cancelPreviousSearch({ request: { cancel: true } }));
    this.scrollIndexChange(0, request, true);

    this.sideNavOpen$.pipe(take(1), filter(Boolean), delay(100)).subscribe(() => this.location.back());
  }

  onAlbumAdded(albumDto: AlbumDto) {
    const album: Album = { ...albumDto, tracks: { ids: [], entities: {} }, maTracks: { ids: [], entities: {} } };
    this.store.dispatch(AlbumActions.addAlbum({ album }));
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
    this.store.dispatch(AlbumActions.createNew());
  }

  onOpenAlbum(id: number) {
    this.store.dispatch(AlbumActions.viewAlbum({ id }));
    this.router.navigate(['album', id]);
  }

  onConnectPhone() {
    this.connectPhoneService.showConnectPhone();
  }

  scrollIndexChange(page: number, request: SearchRequest, force: boolean) {
    this.scrollIndex$.next(page);

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
    this.store.dispatch(AlbumActions.loadAlbums({ request: { ...request, take, skip } }));
  }
}
