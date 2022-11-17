import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnInit, Optional } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { ApplyLyricsComponent } from '@metal-p3/maintenance/ui';
import {
  AlbumActions,
  CoverActions,
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
  TrackActions,
} from '@metal-p3/shared/data-access';
import { nonNullable } from '@metal-p3/shared/utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  standalone: true,
  imports: [AsyncPipe, ApplyLyricsComponent, MatDialogModule],
  selector: 'app-apply-lyrics-shell',
  templateUrl: './apply-lyrics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLyricsShellComponent implements OnInit {
  albumId$ = this.store.select(selectRouteParams).pipe(
    untilDestroyed(this),
    map((params) => params?.id || this.data?.albumId),
    filter((id) => !!id)
  );

  album$ = this.store.select(selectAlbum);

  tracksLoading$ = this.store.select(selectTracksLoading);
  gettingMaTracks$ = this.store.select(selectGettingMaTracks);
  lyricsLoadingProgress$ = this.store.select(selectLyricsLoadingProgress);

  tracks$ = this.store.select(selectTracks);
  maTracks$ = this.store.select(selectMaTracks);
  albumUrl$ = this.store.select(selectAlbumUrl);
  albumFolder$ = this.store.select(selectAlbumFolder);
  coverLoading$ = this.store.select(selectCoverLoading);
  cover$ = this.store.select(selectCover);

  trackTransferring$ = this.store.select(selectTrackTransferring);
  trackTransferringProgress$ = this.store.select(selectTrackTransferringProgress);
  applying$ = this.store.select(selectAlbumSaving);
  applyingProgress$ = this.store.select(selectTrackSavingProgress);

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
        tap((id) => this.store.dispatch(AlbumActions.viewAlbum({ id })))
      )
      .subscribe();

    this.album$
      .pipe(
        untilDestroyed(this),
        filter((album) => !album),
        take(1),
        withLatestFrom(this.albumId$),
        tap(([_album, id]) => this.store.dispatch(AlbumActions.getAlbum({ id })))
      )
      .subscribe();

    combineLatest([this.album$.pipe(nonNullable()), this.tracks$])
      .pipe(
        untilDestroyed(this),
        filter(([album, tracks]) => !album.tracksLoading && !tracks),
        map(([album]) => ({ id: album.id, folder: album.folder })),
        tap(({ id, folder }) => this.store.dispatch(TrackActions.getTracks({ id, folder }))),
        take(1)
      )
      .subscribe();

    combineLatest([this.album$.pipe(nonNullable()), this.maTracks$])
      .pipe(
        untilDestroyed(this),
        filter(([album, maTracks]) => !!album.albumUrl && !album.gettingMaTracks && !maTracks),
        map(([album]) => ({ id: album.id, url: album.albumUrl || '' })),
        tap(({ id, url }) => this.store.dispatch(TrackActions.getMetalArchivesTracks({ id, url }))),
        take(1)
      )
      .subscribe();

    this.maTracks$
      .pipe(
        untilDestroyed(this),
        filter((maTracks) => !!maTracks),
        withLatestFrom(this.albumId$),
        tap(([maTracks, id]) => {
          maTracks?.filter((track) => track.hasLyrics && !track.lyricsLoading).forEach((track) => this.store.dispatch(TrackActions.getLyrics({ id, trackId: track.id })));
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
        tap(({ id, folder }) => this.store.dispatch(CoverActions.get({ id, folder })))
      )
      .subscribe();
  }

  onApply(id: number, lyrics: ApplyLyrics[]) {
    lyrics.map((track) => {
      if (track.maTrack?.lyrics) {
        this.store.dispatch(TrackActions.saveTrack({ id, track: { ...track, lyrics: this.formatLyrics(track.maTrack.lyrics) } }));
      }
    });

    this.store.dispatch(AlbumActions.setHasLyrics({ id, hasLyrics: true }));

    this.applied = true;
  }

  private formatLyrics(lyrics: string): string {
    return lyrics.replace(/<br \/>/gi, '');
  }

  onTransfer(tracks: { id: number; trackId: number }[]) {
    tracks.forEach((track) => this.store.dispatch(TrackActions.transferTrack({ id: track.id, trackId: track.trackId })));
    this.store.dispatch(AlbumActions.setTransferred({ id: tracks[0].id, transferred: true }));
  }

  onDone() {
    this.dialogRef.close({ id: this.data.historyId, apply: this.applied });
  }
}
