import { ChangeDetectionStrategy, Component, Inject, OnInit, Optional } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplyLyrics } from '@metal-p3/album/domain';
import {
  getAlbum,
  getCover,
  getLyrics,
  getMaTracks,
  getTracks,
  saveTrack,
  selectAlbum,
  selectAlbumFolder,
  selectAlbumSaving,
  selectAlbumUrl,
  selectCover,
  selectCoverLoading,
  selectGettingMaTracks,
  selectLyricsLoadingProgress,
  selectMaTracks,
  selectRouteParams,
  selectTracks,
  selectTrackSavingProgress,
  selectTracksLoading,
  selectTrackTransferring,
  selectTrackTransferringProgress,
  setHasLyrics,
  setTransferred,
  transferTrack,
  viewAlbum,
} from '@metal-p3/shared/data-access';
import { nonNullable } from '@metal-p3/shared/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-apply-lyrics-shell',
  templateUrl: './apply-lyrics.component.html',
  styleUrls: ['./apply-lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLyricsShellComponent implements OnInit {
  albumId$ = this.store.pipe(
    untilDestroyed(this),
    select(selectRouteParams),
    map((params) => params?.id || this.data?.albumId),
    filter((id) => !!id)
  );

  album$ = this.store.pipe(select(selectAlbum));

  tracksLoading$ = this.store.pipe(select(selectTracksLoading));
  gettingMaTracks$ = this.store.pipe(select(selectGettingMaTracks));
  lyricsLoadingProgress$ = this.store.pipe(select(selectLyricsLoadingProgress));

  tracks$ = this.store.pipe(select(selectTracks));
  maTracks$ = this.store.pipe(select(selectMaTracks));
  albumUrl$ = this.store.pipe(select(selectAlbumUrl));
  albumFolder$ = this.store.pipe(select(selectAlbumFolder));
  coverLoading$ = this.store.pipe(select(selectCoverLoading));
  cover$ = this.store.pipe(select(selectCover));

  trackTransferring$ = this.store.pipe(select(selectTrackTransferring));
  trackTransferringProgress$ = this.store.pipe(select(selectTrackTransferringProgress));
  applying$ = this.store.pipe(select(selectAlbumSaving));
  applyingProgress$ = this.store.pipe(select(selectTrackSavingProgress));

  showClose = !this.data?.historyId;
  applied = false;

  constructor(
    private readonly store: Store,
    @Optional() private readonly dialogRef: MatDialogRef<ApplyLyricsShellComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: { albumId: number; historyId: number }
  ) {}

  ngOnInit(): void {
    this.setState();
  }

  private setState(): void {
    this.albumId$
      .pipe(
        take(1),
        tap((id) => this.store.dispatch(viewAlbum({ id })))
      )
      .subscribe();

    this.album$
      .pipe(
        untilDestroyed(this),
        filter((album) => !album),
        take(1),
        withLatestFrom(this.albumId$),
        tap(([_album, id]) => this.store.dispatch(getAlbum({ id })))
      )
      .subscribe();

    combineLatest([this.album$.pipe(nonNullable()), this.tracks$])
      .pipe(
        untilDestroyed(this),
        filter(([album, tracks]) => !album.tracksLoading && !tracks),
        map(([album]) => ({ id: album.id, folder: album.folder })),
        tap(({ id, folder }) => this.store.dispatch(getTracks({ id, folder }))),
        take(1)
      )
      .subscribe();

    combineLatest([this.album$.pipe(nonNullable()), this.maTracks$])
      .pipe(
        untilDestroyed(this),
        filter(([album, maTracks]) => !!album.albumUrl && !album.gettingMaTracks && !maTracks),
        map(([album]) => ({ id: album.id, url: album.albumUrl || '' })),
        tap(({ id, url }) => this.store.dispatch(getMaTracks({ id, url }))),
        take(1)
      )
      .subscribe();

    this.maTracks$
      .pipe(
        untilDestroyed(this),
        filter((maTracks) => !!maTracks),
        withLatestFrom(this.albumId$),
        tap(([maTracks, id]) => {
          maTracks?.filter((track) => track.hasLyrics && !track.lyricsLoading).forEach((track) => this.store.dispatch(getLyrics({ id, trackId: track.id })));
        }),
        take(1)
      )
      .subscribe();

    combineLatest([this.album$.pipe(nonNullable()), this.cover$])
      .pipe(
        untilDestroyed(this),
        filter(([album, cover]) => !album.cover && !cover),
        map(([album]) => ({ id: album.id, folder: album.folder })),
        take(1),
        tap(({ id, folder }) => this.store.dispatch(getCover({ id, folder })))
      )
      .subscribe();
  }

  onApply(id: number, lyrics: ApplyLyrics[]) {
    lyrics.map((track) => {
      if (track.maTrack?.lyrics) {
        this.store.dispatch(saveTrack({ id, track: { ...track, lyrics: this.formatLyrics(track.maTrack.lyrics) } }));
      }
    });

    this.store.dispatch(setHasLyrics({ id, hasLyrics: true }));

    this.applied = true;
  }

  private formatLyrics(lyrics: string): string {
    return lyrics.replace(/<br \/>/gi, '');
  }

  onTransfer(tracks: { id: number; trackId: number }[]) {
    tracks.forEach((track) => this.store.dispatch(transferTrack({ id: track.id, trackId: track.trackId })));
    this.store.dispatch(setTransferred({ id: tracks[0].id, transferred: true }));
  }

  onDone() {
    this.dialogRef.close({ id: this.data.historyId, apply: this.applied });
  }
}
