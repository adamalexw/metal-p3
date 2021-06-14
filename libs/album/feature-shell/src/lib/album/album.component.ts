/* eslint-disable @typescript-eslint/no-unused-vars */
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AlbumService } from '@metal-p3/album/data-access';
import { BandDto, Track } from '@metal-p3/api-interfaces';
import { CoverService } from '@metal-p3/cover/data-access';
import { addTracksToPlaylist, addTrackToPlaylist, clearPlaylist, playItem } from '@metal-p3/player/data-access';
import {
  Album,
  downloadCover,
  findMaUrl,
  getAlbum,
  getBandProps,
  getCover,
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
  selectBandProps,
  selectCover,
  selectCoverLoading,
  selectedAlbum,
  selectFindingUrl,
  selectGettingMaTracks,
  selectLyricsLoading,
  selectLyricsLoadingProgress,
  selectMaTracks,
  selectMaUrls,
  selectRenamingFolder,
  selectRenamingFolderError,
  selectRouteParams,
  selectTrackRenaming,
  selectTrackRenamingProgress,
  selectTracks,
  selectTrackSavingProgress,
  selectTracksLoading,
  selectTracksRequired,
  selectTrackTransferring,
  selectTrackTransferringProgress,
  setTransferred,
  transferTrack,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { mapTrackToPlaylistItem } from '@metal-p3/shared/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { combineLatest, of } from 'rxjs';
import { exhaustMap, filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

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

  tracksLoading$ = this.store.pipe(select(selectTracksLoading));
  tracks$ = this.store.pipe(select(selectTracks));
  trackSavingProgress$ = this.store.pipe(select(selectTrackSavingProgress));

  coverLoading$ = this.store.pipe(select(selectCoverLoading));
  cover$ = this.store.pipe(select(selectCover));

  findingUrl$ = this.store.pipe(select(selectFindingUrl));
  maUrls$ = this.store.pipe(select(selectMaUrls));

  trackRenaming$ = this.store.pipe(select(selectTrackRenaming));
  trackRenamingProgress$ = this.store.pipe(select(selectTrackRenamingProgress));

  trackTransferring$ = this.store.pipe(select(selectTrackTransferring));
  trackTransferringProgress$ = this.store.pipe(select(selectTrackTransferringProgress));

  renamingFolder$ = this.store.pipe(select(selectRenamingFolder));
  renamingFolderError$ = this.store.pipe(select(selectRenamingFolderError));

  lyricsLoading$ = this.store.pipe(select(selectLyricsLoading));
  lyricsLoadingProgress$ = this.store.pipe(select(selectLyricsLoadingProgress));

  gettingMaTracks$ = this.store.pipe(select(selectGettingMaTracks));
  maTracks$ = this.store.pipe(select(selectMaTracks));

  gettingBandProps$ = this.store.pipe(select(selectBandProps));
  bandProps$ = this.store.pipe(select(selectBandProps));

  routeId$ = this.store.pipe(
    untilDestroyed(this),
    select(selectRouteParams),
    map((params) => params?.id),
    filter((id) => !!id)
  );

  constructor(private readonly store: Store, private readonly albumService: AlbumService, private readonly coverService: CoverService, private readonly router: Router) {}

  ngOnInit(): void {
    this.setState();
  }

  private setState(): void {
    const albumId$ = this.routeId$.pipe(
      withLatestFrom(this.store.pipe(select(selectedAlbum))),
      filter(([routeId, selectedId]) => routeId !== selectedId),
      tap(([routeId, _albumId]) => this.store.dispatch(viewAlbum({ id: routeId }))),
      map(([routeId, _albumId]) => routeId),
      take(1)
    );

    this.album$
      .pipe(
        untilDestroyed(this),
        filter((album) => !album),
        take(1),
        withLatestFrom(albumId$),
        filter(([_album, id]) => !!id),
        tap(([_album, id]) => {
          this.store.dispatch(getAlbum({ id }));
          this.store.dispatch(viewAlbum({ id }));
        })
      )
      .subscribe();

    combineLatest([this.album$, this.store.pipe(select(selectTracksRequired))])
      .pipe(
        untilDestroyed(this),
        filter(([album, required]) => album && !album.tracksLoading && required),
        map(([album]) => ({ id: album?.id, folder: album?.folder })),
        tap(({ id, folder }) => this.store.dispatch(getTracks({ id, folder })))
      )
      .subscribe();

    combineLatest([this.album$, this.cover$])
      .pipe(
        untilDestroyed(this),
        filter(([album, cover]) => album && !album.cover && !cover),
        map(([album]) => ({ id: album?.id, folder: album?.folder })),
        take(1),
        tap(({ id, folder }) => this.store.dispatch(getCover({ id, folder })))
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

  onMaTracks(id: number, url: string) {
    this.store.dispatch(getMaTracks({ id, url }));
  }

  onLyrics(id: number, url: string): void {
    const maTracks$ = this.maTracks$.pipe(
      untilDestroyed(this),
      tap((maTracks) => {
        if (!maTracks) {
          this.onMaTracks(id, url);
        }
      }),
      filter((maTracks) => !!maTracks),
      take(1)
    );

    maTracks$
      .pipe(
        exhaustMap((maTracks) => {
          maTracks?.forEach((track) => this.store.dispatch(getLyrics({ id, trackId: track.id })));
          return of(maTracks);
        }),
        take(1),
        tap(() => this.router.navigate(['album', 'lyrics', id]))
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

  onOpenFolder(folder: string) {
    this.albumService.openFolder(folder).subscribe();
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
    this.store.dispatch(clearPlaylist());
    this.onAddAlbumToPlaylist(albumId);
  }

  onAddAlbumToPlaylist(albumId: number) {
    this.tracks$
      .pipe(
        take(1),
        map((tracks) => tracks?.map((track) => mapTrackToPlaylistItem(track, albumId))),
        tap((tracks) => this.store.dispatch(addTracksToPlaylist({ tracks })))
      )
      .subscribe();
  }

  onPlayTrack(track: Track, albumId: number) {
    this.store.dispatch(clearPlaylist());
    const id = this.onAddTrackToPlaylist(track, albumId);
    this.store.dispatch(playItem({ id }));
  }

  onAddTrackToPlaylist(track: Track, albumId: number): string {
    const playlistItem = mapTrackToPlaylistItem(track, albumId);
    this.store.dispatch(addTrackToPlaylist({ track: playlistItem }));
    return playlistItem.id;
  }
}
