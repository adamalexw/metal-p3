import { ViewportRuler } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { SearchRequest } from '@metal-p3/album/domain';
import { Track } from '@metal-p3/api-interfaces';
import { addTracksToPlaylist, clearPlaylist, selectPlaylist } from '@metal-p3/player/data-access';
import {
  addNewAlbum,
  Album,
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
  selectTracks,
  selectTracksRequired,
  transferTrack,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { mapTrackToPlaylistItem, toChunks } from '@metal-p3/shared/utils';
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

  albumsView$ = combineLatest([this.albums$, this.viewportWidth$]).pipe(
    filter(([albums, width]) => !!albums && !!width),
    map(([albums, width]) => {
      const chunks = Math.floor(width / 300);
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
    private router: Router,
    private notificationService: NotificationService,
    private readonly service: AlbumService,
    private readonly viewportRuler: ViewportRuler
  ) {}

  ngOnInit(): void {
    this.albumsLoadError$
      .pipe(
        filter((error) => !!error),
        tap((error: string) => this.notificationService.showError(error, 'Load Albums')),
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
        tap((tracks: Track[]) => tracks.forEach((track) => this.store.dispatch(transferTrack({ id, trackId: track.id })))),
        take(1)
      )
      .subscribe();
  }

  onPlayAlbum(id: number, folder: string) {
    this.store.dispatch(clearPlaylist());
    this.onAddToPlaylist(id, folder);
  }

  onAddToPlaylist(id: number, folder: string) {
    const tracks$ = this.getTracks(id, folder);

    tracks$
      .pipe(
        map((tracks: Track[]) => tracks.map((track) => mapTrackToPlaylistItem(track, id))),
        tap((tracks) => this.store.dispatch(addTracksToPlaylist({ tracks }))),
        take(1)
      )
      .subscribe();
  }

  private getTracks(id: number, folder: string): Observable<Track[] | undefined> {
    this.store.dispatch(viewAlbum({ id }));

    this.store
      .pipe(select(selectTracksRequired))
      .pipe(
        take(1),
        filter((required) => !!required),
        tap(() => this.store.dispatch(getTracks({ id, folder })))
      )
      .subscribe();

    return this.store.pipe(
      select(selectTracks),
      filter((tracks) => !!tracks)
    );
  }

  identify(index: number, item: Album) {
    return item.id;
  }

  onSearch(request: SearchRequest) {
    this.fetchedPages.clear();
    this.store.dispatch(clearCovers());
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

    let skip = 0;
    let take = 16;

    if (page === 0) {
      take = 40;
    } else {
      skip = 40 + 16 * page;
    }

    this.fetchedPages.add(page);
    this.store.dispatch(loadAlbums({ request: { take, skip, criteria } }));
  }
}
