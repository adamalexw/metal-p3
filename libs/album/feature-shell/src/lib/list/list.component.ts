import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SearchRequest } from '@metal-p3/album/domain';
import { Track } from '@metal-p3/api-interfaces';
import { addTracksToPlaylist } from '@metal-p3/player/data-access';
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
  selectAlbumsLoading,
  selectCreatingNew,
  selectTracks,
  selectTracksRequired,
  transferTrack,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { mapTrackToPlaylistItem } from '@metal-p3/shared/utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

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
  albums$ = this.store.pipe(select(selectAlbums));

  creatingNew$ = this.store.pipe(select(selectCreatingNew));

  @Output()
  readonly openAlbum = new EventEmitter<number>();

  constructor(private readonly store: Store, private notificationService: NotificationService) {}

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

  onAddToPlaylist(id: number, folder: string) {
    const tracks$ = this.getTracks(id, folder);

    tracks$
      .pipe(
        map((tracks: Track[]) => tracks.map(mapTrackToPlaylistItem)),
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
    this.store.dispatch(clearCovers());
    this.store.dispatch(loadAlbums({ request }));
  }

  onAlbumAdded(folders: string[]) {
    folders.forEach((folder) => this.store.dispatch(addNewAlbum({ folder })));
  }

  onCreateNew() {
    this.store.dispatch(createNew());
  }
}
