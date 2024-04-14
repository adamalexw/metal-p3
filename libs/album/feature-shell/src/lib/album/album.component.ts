import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AlbumDataAccessModule, AlbumService } from '@metal-p3/album/data-access';
import { AlbumComponent } from '@metal-p3/album/ui';
import { MetalArchivesAlbumTrack, TrackBase } from '@metal-p3/api-interfaces';
import { CoverService } from '@metal-p3/cover/data-access';
import { MaintenanceActions } from '@metal-p3/maintenance/data-access';
import { PlayerService } from '@metal-p3/player/data-access';
import {
  AlbumActions,
  AlbumWithoutTracks,
  BandActions,
  CoverActions,
  TrackActions,
  selectAlbum,
  selectAlbumSaving,
  selectBandProps,
  selectCover,
  selectCoverLoading,
  selectCoverRequired,
  selectFindingUrl,
  selectGettingBandProps,
  selectGettingMaTracks,
  selectLyricsLoading,
  selectMaTracks,
  selectMaUrls,
  selectRenamingFolder,
  selectRenamingFolderError,
  selectRouteId,
  selectSaveAlbumError,
  selectSelectedAlbumId,
  selectTrackRenaming,
  selectTrackRenamingProgress,
  selectTrackSavingProgress,
  selectTrackTransferring,
  selectTrackTransferringProgress,
  selectTracks,
  selectTracksDuration,
  selectTracksError,
  selectTracksLoading,
  selectTracksRequired,
} from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { nonNullable, objectDistinctUntilChanged } from '@metal-p3/shared/utils';
import { Track } from '@metal-p3/track/domain';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Update } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  standalone: true,
  imports: [AsyncPipe, RouterModule, AlbumDataAccessModule, AlbumComponent],
  selector: 'app-album-shell',
  templateUrl: './album.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumShellComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly albumService = inject(AlbumService);
  private readonly coverService = inject(CoverService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly playerService = inject(PlayerService);

  album$ = this.store.select(selectAlbum).pipe(nonNullable());
  albumSaving$ = this.store.select(selectAlbumSaving);
  saveError$ = this.store.select(selectSaveAlbumError);

  tracksLoading$ = this.store.select(selectTracksLoading);
  tracks$ = this.store.select(selectTracks);
  tracksError$ = this.store.select(selectTracksError);
  albumDuration$ = this.store.select(selectTracksDuration);

  trackSavingProgress$ = this.store.select(selectTrackSavingProgress);

  coverLoading$ = this.store.select(selectCoverLoading);
  cover$ = this.store.select(selectCover);

  findingUrl$ = this.store.select(selectFindingUrl);
  maUrls$ = this.store.select(selectMaUrls).pipe(
    filter((urls) => !!urls && !!(urls.albumUrl || urls.artistUrl)),
    objectDistinctUntilChanged(),
  );

  trackRenaming$ = this.store.select(selectTrackRenaming);
  trackRenamingProgress$ = this.store.select(selectTrackRenamingProgress);

  trackTransferring$ = this.store.select(selectTrackTransferring);
  trackTransferringProgress$ = this.store.select(selectTrackTransferringProgress);

  renamingFolder$ = this.store.select(selectRenamingFolder);
  renamingFolderError$ = this.store.select(selectRenamingFolderError);

  lyricsLoading$ = this.store.select(selectLyricsLoading);

  gettingMaTracks$ = this.store.select(selectGettingMaTracks);
  maTracks$ = this.store.select(selectMaTracks);

  gettingBandProps$ = this.store.select(selectGettingBandProps);
  bandProps$ = this.store.select(selectBandProps);

  routeId$ = this.store.select(selectRouteId).pipe(untilDestroyed(this), nonNullable());

  ngOnInit(): void {
    this.setState();
    this.errorNotifications();
  }

  private setState(): void {
    // when refreshing the page get the album id from the url
    this.routeId$
      .pipe(
        withLatestFrom(this.store.select(selectSelectedAlbumId)),
        filter(([routeId, selectedId]) => +routeId !== selectedId),
        tap(([routeId, _albumId]) => this.store.dispatch(AlbumActions.viewAlbum({ id: +routeId }))),
        take(1),
      )
      .subscribe();

    const dispatchProps$ = this.album$.pipe(
      nonNullable(),
      map((album) => ({ id: album.id, folder: album.folder })),
      distinctUntilChanged((prev, curr) => prev.id === curr.id),
    );

    // if tracks haven't been loaded dispatch an action to the load them
    combineLatest([dispatchProps$, this.tracksLoading$, this.store.select(selectTracksRequired)])
      .pipe(
        untilDestroyed(this),
        filter(([_props, loading, required]) => required && !loading),
        tap(([props, _loading, _required]) => this.store.dispatch(TrackActions.getTracks(props))),
      )
      .subscribe();

    // if the album doesn't have a cover dispatch an action to load it
    combineLatest([dispatchProps$, this.coverLoading$, this.store.select(selectCoverRequired)])
      .pipe(
        untilDestroyed(this),
        filter(([_props, loading, required]) => required && !loading),
        tap(([props, _loading, _required]) => this.store.dispatch(CoverActions.get(props))),
      )
      .subscribe();

    // when opening the album check for extra files
    this.album$
      .pipe(
        nonNullable(),
        tap((album) => this.store.dispatch(AlbumActions.getExtraFiles({ id: album.id, folder: album.folder }))),
        take(1),
      )
      .subscribe();
  }

  onDownloadCover(id: number, url: string) {
    this.store.dispatch(CoverActions.download({ id, url }));
  }

  onSave(album: AlbumWithoutTracks, tracks: TrackBase[]) {
    this.store.dispatch(AlbumActions.saveAlbum({ album }));

    if (album.cover) {
      this.coverService
        .getCoverDto(album.cover)
        .pipe(
          map((cover) => cover as string),
          tap((cover) => this.dispatchTracks({ ...album, cover }, tracks)),
          tap((cover) => this.store.dispatch(CoverActions.save({ id: album.id, folder: album.fullPath, cover }))),
        )
        .subscribe();
    } else {
      this.dispatchTracks(album, tracks);
    }
  }

  onFindUrl(id: number, artist: string, album: string) {
    this.store.dispatch(AlbumActions.findMetalArchivesUrl({ id, artist, album }));
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

          this.store.dispatch(TrackActions.updateTracksSuccess({ id, updates }));
        }),
        take(1),
      )
      .subscribe();
  }

  onTrackNumbers(albumId: number) {
    this.tracks$
      .pipe(
        nonNullable(),
        tap((tracks) => {
          const updates: Update<Track>[] = tracks.map((track, index) => ({ id: track.id, changes: { trackNumber: (index + 1).toString().padStart(2, '0') } }));
          this.store.dispatch(TrackActions.updateTracksSuccess({ id: albumId, updates }));
        }),
        take(1),
      )
      .subscribe();
  }

  onLyrics(id: number, url: string): void {
    const maTracks$ = this.getMaTracks(id, url);

    maTracks$
      .pipe(
        take(1),
        tap(() => this.router.navigate(['maintenance', 'lyrics', id])),
      )
      .subscribe();
  }

  onRenameTracks(id: number, tracks: Track[]) {
    tracks.forEach((track) => {
      this.store.dispatch(TrackActions.renameTrack({ id, track }));
    });
  }

  onRenameFolder(id: number, src: string, artist: string, album: string) {
    this.store.dispatch(AlbumActions.renameFolder({ id, src, artist, album }));
  }

  onOpenFolder(id: number, folder: string) {
    this.store.dispatch(AlbumActions.setExtraFiles({ update: { id, changes: { extraFiles: false } } }));
    this.albumService.openFolder(folder).subscribe();
  }

  onLyricsPriority(albumId: number) {
    this.store.dispatch(MaintenanceActions.addLyricsPriority({ albumId }));
  }

  onRefreshTracks(id: number, folder: string) {
    this.store.dispatch(TrackActions.getTracks({ id, folder }));
  }

  onFindBandProps(id: number, url: string) {
    this.bandProps$
      .pipe(
        untilDestroyed(this),
        filter((props) => !props),
        tap(() => this.store.dispatch(BandActions.getProps({ id, url }))),
        take(1),
      )
      .subscribe();
  }

  onTransferAlbum(tracks: { id: number; trackId: number }[]) {
    tracks.forEach((track) => this.onTransferTrack(track.id, track.trackId));

    this.store.dispatch(AlbumActions.setTransferred({ id: tracks[0].id, transferred: true }));
  }

  onTransferTrack(id: number, trackId: number) {
    this.store.dispatch(TrackActions.transferTrack({ id, trackId }));
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
    this.store.dispatch(TrackActions.deleteTrack({ id: albumId, track }));
  }

  onDeleteAlbum(id: number) {
    this.store.dispatch(AlbumActions.deleteAlbum({ id }));
    this.router.navigate(['/']);
  }

  private getMaTracks(id: number, url: string): Observable<MetalArchivesAlbumTrack[] | undefined> {
    return this.maTracks$.pipe(
      untilDestroyed(this),
      tap((maTracks) => {
        if (!maTracks) {
          this.store.dispatch(TrackActions.getMetalArchivesTracks({ id, url }));
        }
      }),
      filter((maTracks) => !!maTracks),
      take(1),
    );
  }

  private dispatchTracks(album: AlbumWithoutTracks, tracks: TrackBase[]) {
    tracks.forEach((albumTrack) => {
      const track = this.getTrack(album, albumTrack);
      this.store.dispatch(TrackActions.saveTrack({ id: album.id, track }));
    });
  }

  private getTrack(album: AlbumWithoutTracks, albumTrack: Track): Track {
    const { artist, genre, year, artistUrl, albumUrl, cover } = album;
    const track = { ...albumTrack, artist, genre, year, artistUrl, albumUrl, cover, album: album.album };
    return track;
  }

  private errorNotifications() {
    this.saveError$
      .pipe(
        untilDestroyed(this),
        nonNullable(),
        tap((error) => this.notificationService.showError(error, 'Save')),
      )
      .subscribe();
  }
}
