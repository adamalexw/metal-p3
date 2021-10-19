import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { BandDto, MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { CoverService } from '@metal-p3/cover/data-access';
import { addLyricsPriority } from '@metal-p3/maintenance/data-access';
import { PlayerService } from '@metal-p3/player/data-access';
import {
  Album,
  deleteAlbum,
  deleteTrack,
  downloadCover,
  findMaUrl,
  getAlbum,
  getBandProps,
  getCover,
  getExtraFiles,
  getLyrics,
  getMaTracks,
  getTracks,
  renameFolder,
  renameTrack,
  saveAlbum,
  saveBand,
  saveCover,
  saveTrack,
  selectAlbum,
  selectAlbumSaving,
  selectAlbumsLoaded,
  selectBandProps,
  selectCover,
  selectCoverLoading,
  selectCoverRequired,
  selectedAlbumId,
  selectFindingUrl,
  selectGettingBandProps,
  selectGettingMaTracks,
  selectLyricsLoading,
  selectMaTracks,
  selectMaUrls,
  selectRenamingFolder,
  selectRenamingFolderError,
  selectRouteParams,
  selectSaveAlbumError,
  selectTrackRenaming,
  selectTrackRenamingProgress,
  selectTracks,
  selectTrackSavingProgress,
  selectTracksDuration,
  selectTracksLoading,
  selectTracksRequired,
  selectTrackTransferring,
  selectTrackTransferringProgress,
  setExtraFiles,
  setTransferred,
  transferTrack,
  updateTracks,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { nonNullable } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Update } from '@ngrx/entity';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, exhaustMap, filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-album-shell',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumShellComponent implements OnInit {
  @Output()
  readonly closeAlbum = new EventEmitter<void>();

  album$ = this.store.pipe(select(selectAlbum));
  albumSaving$ = this.store.pipe(select(selectAlbumSaving));
  saveError$ = this.store.pipe(select(selectSaveAlbumError));

  tracksLoading$ = this.store.pipe(select(selectTracksLoading));
  tracks$ = this.store.pipe(select(selectTracks));
  albumDuration$ = this.store.pipe(select(selectTracksDuration));

  trackSavingProgress$ = this.store.pipe(select(selectTrackSavingProgress));

  coverLoading$ = this.store.pipe(select(selectCoverLoading));
  cover$ = this.store.pipe(select(selectCover));

  findingUrl$ = this.store.pipe(select(selectFindingUrl));
  maUrls$ = this.store.pipe(
    select(selectMaUrls),
    filter((urls) => !!urls && !!(urls.albumUrl || urls.artistUrl))
  );

  trackRenaming$ = this.store.pipe(select(selectTrackRenaming));
  trackRenamingProgress$ = this.store.pipe(select(selectTrackRenamingProgress));

  trackTransferring$ = this.store.pipe(select(selectTrackTransferring));
  trackTransferringProgress$ = this.store.pipe(select(selectTrackTransferringProgress));

  renamingFolder$ = this.store.pipe(select(selectRenamingFolder));
  renamingFolderError$ = this.store.pipe(select(selectRenamingFolderError));

  lyricsLoading$ = this.store.pipe(select(selectLyricsLoading));

  gettingMaTracks$ = this.store.pipe(select(selectGettingMaTracks));
  maTracks$ = this.store.pipe(select(selectMaTracks));

  gettingBandProps$ = this.store.pipe(select(selectGettingBandProps));
  bandProps$ = this.store.pipe(select(selectBandProps));

  routeId$ = this.store.pipe(
    untilDestroyed(this),
    select(selectRouteParams),
    map((params) => params?.id),
    filter((id) => !!id)
  );

  constructor(
    private readonly store: Store,
    private readonly albumService: AlbumService,
    private readonly coverService: CoverService,
    private readonly router: Router,
    private readonly notificationService: NotificationService,
    private readonly playerService: PlayerService
  ) {}

  ngOnInit(): void {
    this.setState();
    this.errorNotifications();
  }

  private setState(): void {
    // when refreshing the page get the album id from the url
    this.routeId$
      .pipe(
        withLatestFrom(this.store.pipe(select(selectedAlbumId))),
        filter(([routeId, selectedId]) => +routeId !== selectedId),
        tap(([routeId, _albumId]) => this.store.dispatch(viewAlbum({ id: routeId }))),
        take(1)
      )
      .subscribe();

    // wait for albums list to load
    // select the id from the url
    // if the album doesn't exist in the list get it from the api
    combineLatest([this.store.select(selectAlbumsLoaded), this.album$])
      .pipe(
        untilDestroyed(this),
        filter(([loaded, album]) => loaded && !album),
        withLatestFrom(this.store.pipe(select(selectedAlbumId))),
        map(([_album, id]) => id),
        filter((id) => !!id),
        withLatestFrom(this.album$),
        filter(([_id, album]) => !album),
        tap(([id, _album]) => {
          if (id) {
            this.store.dispatch(getAlbum({ id }));
          }
        })
      )
      .subscribe();

    const dispatchProps$ = this.album$.pipe(
      nonNullable(),
      map((album) => ({ id: album.id, folder: album.folder })),
      distinctUntilChanged((prev, curr) => prev.id === curr.id)
    );

    // if tracks haven't been loaded dispatch an action to the load them
    combineLatest([dispatchProps$, this.tracksLoading$, this.store.pipe(select(selectTracksRequired))])
      .pipe(
        untilDestroyed(this),
        filter(([_props, loading, required]) => required && !loading),
        tap(([props, _loading, _required]) => this.store.dispatch(getTracks(props)))
      )
      .subscribe();

    // if the album doesn't have a cover dispatch an action to load it
    combineLatest([dispatchProps$, this.coverLoading$, this.store.pipe(select(selectCoverRequired))])
      .pipe(
        untilDestroyed(this),
        filter(([_props, loading, required]) => required && !loading),
        tap(([props, _loading, _required]) => this.store.dispatch(getCover(props)))
      )
      .subscribe();

    // when opening the album check for extra files
    this.album$
      .pipe(
        nonNullable(),
        tap((album) => this.store.dispatch(getExtraFiles({ id: album.id, folder: album.folder }))),
        take(1)
      )
      .subscribe();
  }

  private errorNotifications() {
    this.saveError$
      .pipe(
        untilDestroyed(this),
        filter((error) => !!error),
        nonNullable(),
        tap((error) => this.notificationService.showError(error, 'Save'))
      )
      .subscribe();
  }

  onDownloadCover(id: number, url: string) {
    this.store.dispatch(downloadCover({ id, url }));
  }

  onSave(album: Album, tracks: Track[]) {
    this.store.dispatch(saveBand({ band: this.getBandDto(album) }));
    this.store.dispatch(saveAlbum({ album }));

    if (album.cover) {
      this.coverService
        .getCoverDto(album.cover)
        .pipe(
          map((cover) => cover as string),
          tap((cover) => this.dispatchTracks({ ...album, cover }, tracks)),
          tap((cover) => this.store.dispatch(saveCover({ id: album.id, folder: album.fullPath, cover })))
        )
        .subscribe();
    } else {
      this.dispatchTracks(album, tracks);
    }
  }

  private dispatchTracks(album: Album, tracks: Track[]) {
    tracks.forEach((albumTrack) => {
      const track = this.getTrack(album, albumTrack);
      this.store.dispatch(saveTrack({ id: album.id, track }));
    });
  }

  private getTrack(album: Album, albumTrack: Track): Track {
    const { artist, genre, year, artistUrl, albumUrl, cover } = album;
    const track = { ...albumTrack, artist, genre, year, artistUrl, albumUrl, cover, album: album.album };
    return track;
  }

  private getBandDto(album: Album): BandDto {
    return {
      id: album.bandId,
      name: album.artist || '',
      country: album.country,
      genre: album.genre,
      metalArchiveUrl: album.artistUrl,
    };
  }

  onFindUrl(id: number, artist: string, album: string) {
    this.store.dispatch(findMaUrl({ id, artist, album }));
  }

  private getMaTracks(id: number, url: string): Observable<MetalArchivesAlbumTrack[] | undefined> {
    return this.maTracks$.pipe(
      untilDestroyed(this),
      tap((maTracks) => {
        if (!maTracks) {
          this.store.dispatch(getMaTracks({ id, url }));
        }
      }),
      filter((maTracks) => !!maTracks),
      take(1)
    );
  }

  onMaTracks(id: number, url: string) {
    combineLatest([this.tracks$.pipe(nonNullable()), this.getMaTracks(id, url).pipe(nonNullable())])
      .pipe(
        tap(([tracks, maTracks]) => {
          const updates: Update<Track>[] = [];

          for (let index = 0; index < tracks.length; index++) {
            const track = tracks[index];
            const maTrack = maTracks[index];

            updates.push({ id: track.id, changes: { trackNumber: maTrack.trackNumber, title: maTrack.title } });
          }

          this.store.dispatch(updateTracks({ id, updates }));
        }),
        take(1)
      )
      .subscribe();
  }

  onLyrics(id: number, url: string): void {
    const maTracks$ = this.getMaTracks(id, url);

    maTracks$
      .pipe(
        exhaustMap((maTracks) => {
          maTracks?.forEach((track) => this.store.dispatch(getLyrics({ id, trackId: track.id })));
          return of(maTracks);
        }),
        take(1),
        tap(() => this.router.navigate(['maintenance', 'lyrics', id]))
      )
      .subscribe();
  }

  onRenameTracks(id: number, tracks: Track[]) {
    tracks.forEach((track) => {
      this.store.dispatch(renameTrack({ id, track }));
    });
  }

  onRenameFolder(id: number, src: string, artist: string, album: string) {
    this.store.dispatch(renameFolder({ id, src, artist, album }));
  }

  onOpenFolder(id: number, folder: string) {
    this.store.dispatch(setExtraFiles({ update: { id, changes: { extraFiles: false } } }));
    this.albumService.openFolder(folder).subscribe();
  }

  onLyricsPriority(albumId: number) {
    this.store.dispatch(addLyricsPriority({ albumId }));
  }

  onRefreshTracks(id: number, folder: string) {
    this.store.dispatch(getTracks({ id, folder }));
  }

  onFindBandProps(id: number, url: string) {
    this.bandProps$
      .pipe(
        untilDestroyed(this),
        filter((props) => !props),
        tap(() => this.store.dispatch(getBandProps({ id, url }))),
        take(1)
      )
      .subscribe();
  }

  onTransferAlbum(tracks: { id: number; trackId: number }[]) {
    tracks.forEach((track) => this.onTransferTrack(track.id, track.trackId));

    this.store.dispatch(setTransferred({ id: tracks[0].id, transferred: true }));
  }

  onTransferTrack(id: number, trackId: number) {
    this.store.dispatch(transferTrack({ id, trackId }));
  }

  onPlayAlbum(albumId: number) {
    this.playerService.playAlbum(albumId, this.tracks$);
  }

  onAddAlbumToPlaylist(albumId: number) {
    this.playerService.addAlbumToPlaylist(albumId, this.tracks$);
  }

  onPlayTrack(track: Track, albumId: number) {
    this.playerService.playTrack(track, albumId);
  }

  onAddTrackToPlaylist(track: Track, albumId: number) {
    this.playerService.addTrackToPlaylist(track, albumId);
  }

  onDeleteTrack(track: Track, albumId: number): void {
    this.store.dispatch(deleteTrack({ id: albumId, track }));
  }

  onDeleteAlbum(id: number) {
    this.store.dispatch(deleteAlbum({ id }));
    this.router.navigate(['/']);
  }
}
