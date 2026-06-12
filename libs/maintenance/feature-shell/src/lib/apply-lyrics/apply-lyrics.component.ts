import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { ApplyLyricsComponent } from '@metal-p3/maintenance/ui';
import {
  AlbumActions,
  CoverActions,
  TrackActions,
  selectAlbum,
  selectAlbumFolder,
  selectAlbumSaving,
  selectAlbumUrl,
  selectCover,
  selectCoverLoading,
  selectGettingMaTracks,
  selectLyricsExpected,
  selectLyricsLoading,
  selectLyricsLoadingProgress,
  selectMaTracks,
  selectRouteParams,
  selectTrackSavingProgress,
  selectTrackTransferring,
  selectTrackTransferringProgress,
  selectTracks,
  selectTracksLoading,
} from '@metal-p3/shared/data-access';
import { nonNullable } from '@metal-p3/shared/utils';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, filter, map, take, tap, withLatestFrom } from 'rxjs';

@Component({
  imports: [AsyncPipe, ApplyLyricsComponent, MatDialogModule],
  selector: 'app-apply-lyrics-shell',
  templateUrl: './apply-lyrics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLyricsShellComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialogRef = inject(MatDialogRef<ApplyLyricsShellComponent>, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  private readonly data: { albumId: number; historyId: number } = inject(MAT_DIALOG_DATA, { optional: true });

  albumId$: Observable<number> = this.store.select(selectRouteParams).pipe(
    map((params) => params?.id || this.data?.albumId),
    filter((id) => !!id),
    map((id) => +id),
    takeUntilDestroyed(),
  );

  album$ = this.store.select(selectAlbum);

  tracksLoading$ = this.store.select(selectTracksLoading);
  gettingMaTracks$ = this.store.select(selectGettingMaTracks);
  lyricsLoading$ = this.store.select(selectLyricsLoading);
  lyricsExpected$ = this.store.select(selectLyricsExpected);
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

  ngOnInit(): void {
    this.setState();
  }

  private setState(): void {
    this.albumId$
      .pipe(
        take(1),
        tap((id) => this.store.dispatch(AlbumActions.viewAlbum({ id }))),
      )
      .subscribe();

    const album$ = this.album$.pipe(nonNullable());

    album$
      .pipe(
        take(1),
        tap(({ id }) => this.store.dispatch(AlbumActions.getAlbum({ id }))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    combineLatest([album$, this.tracks$])
      .pipe(
        filter(([album, tracks]) => !album.tracksLoading && (!tracks || tracks.length === 0)),
        map(([album]) => ({ id: album.id, folder: album.folder })),
        tap(({ id, folder }) => this.store.dispatch(TrackActions.getTracks({ id, folder }))),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    combineLatest([album$, this.maTracks$])
      .pipe(
        filter(([album, maTracks]) => !!album.albumUrl && !album.gettingMaTracks && (!maTracks || maTracks.length === 0)),
        map(([album]) => ({ id: album.id, url: album.albumUrl || '' })),
        tap(({ id, url }) => this.store.dispatch(TrackActions.getMetalArchivesTracks({ id, url }))),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    // Album has a metal-archives url: drive lyrics from the metal-archives tracklist.
    combineLatest([this.maTracks$, this.tracks$, this.album$.pipe(nonNullable())])
      .pipe(
        filter(([maTracks, tracks]) => !!maTracks?.length && !!tracks?.length),
        withLatestFrom(this.albumId$),
        tap(([[maTracks, tracks, album], id]) => {
          maTracks
            ?.filter((maTrack) => maTrack.hasLyrics && !maTrack.lyricsLoading)
            .forEach((maTrack, i) => {
              const localTrack = this.matchLocalTrack(tracks ?? [], maTrack);
              setTimeout(
                () =>
                  this.store.dispatch(
                    localTrack
                      ? TrackActions.getSyncedLyrics({
                          id,
                          localTrackId: localTrack.id,
                          maTrackId: maTrack.id,
                          artist: album.artist ?? '',
                          track: localTrack.title ?? maTrack.title ?? '',
                          album: album.album ?? '',
                          durationSeconds: localTrack.duration,
                        })
                      : TrackActions.getLyrics({ id, trackId: maTrack.id }),
                  ),
                i * 3000,
              );
            });
        }),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    // Album has no metal-archives url: drive lyrics from the local mp3 tracks via LrcLib.
    combineLatest([this.tracks$, this.album$.pipe(nonNullable())])
      .pipe(
        filter(([tracks, album]) => !album.albumUrl && !!tracks?.length),
        withLatestFrom(this.albumId$),
        tap(([[tracks, album], id]) => {
          (tracks ?? [])
            .filter((track) => !track.lyricsLoading && !track.lyricsChecked)
            .forEach((track, i) => {
              setTimeout(
                () =>
                  this.store.dispatch(
                    TrackActions.getLocalLyrics({
                      id,
                      localTrackId: track.id,
                      artist: album.artist ?? track.artist ?? '',
                      track: track.title ?? '',
                      album: album.album ?? track.album ?? '',
                      durationSeconds: track.duration,
                    }),
                  ),
                i * 3000,
              );
            });
        }),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    combineLatest([album$, this.cover$])
      .pipe(
        filter(([album, cover]) => !album.cover && !cover),
        map(([album]) => ({ id: album.id, folder: album.folder })),
        take(1),
        tap(({ id, folder }) => this.store.dispatch(CoverActions.get({ id, folder }))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onApply(id: number, lyrics: ApplyLyrics[]) {
    const tracksToSave = lyrics
      .filter((track) => track.syncedLyrics || track.maTrack?.lyrics || (track.lyricsSource === 'plain' && track.lyrics))
      .map((track) => {
        if (track.syncedLyrics) {
          return { ...track };
        }
        if (track.maTrack?.lyrics) {
          return { ...track, lyrics: this.formatLyrics(track.maTrack.lyrics) };
        }
        // Local (no metal-archives url) plain lyrics already live on track.lyrics from LrcLib
        return { ...track };
      });

    if (tracksToSave.length) {
      this.store.dispatch(TrackActions.saveTracks({ id, tracks: tracksToSave }));
    }

    this.store.dispatch(AlbumActions.setHasLyrics({ id, hasLyrics: true }));

    this.applied = true;
  }

  private formatLyrics(lyrics: string): string {
    return lyrics.replace(/<br \/>/gi, '');
  }

  private matchLocalTrack(tracks: { id: number; title?: string; trackNumber?: string; duration?: number }[], maTrack: { trackNumber?: string; title?: string }) {
    const byTitle = tracks.find((t) => !!t.title && t.title.toLowerCase() === maTrack.title?.toLowerCase());
    if (byTitle) {
      return byTitle;
    }

    if (maTrack.trackNumber) {
      const byNumber = tracks.find((t) => Number(t.trackNumber) === Number(maTrack.trackNumber));
      if (byNumber) {
        return byNumber;
      }
    }
    return undefined;
  }

  onTransfer(tracks: { id: number; trackId: number }[]) {
    tracks.forEach((track) => this.store.dispatch(TrackActions.transferTrack({ id: track.id, trackId: track.trackId })));
    this.store.dispatch(AlbumActions.setTransferred({ id: tracks[0].id, transferred: true }));
  }

  onDone() {
    this.dialogRef?.close({ id: this.data.historyId, apply: this.applied });
  }
}
