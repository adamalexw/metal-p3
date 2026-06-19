
import { ChangeDetectionStrategy, Component, OnInit, inject, computed, effect, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AlbumStore } from '@metal-p3/album/data-access';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { CoverStore } from '@metal-p3/cover/data-access';
import { ApplyLyricsComponent } from '@metal-p3/maintenance/ui';
import { TrackStore } from '@metal-p3/track/data-access';

@Component({
  imports: [ApplyLyricsComponent, MatDialogModule],
  selector: 'app-apply-lyrics-shell',
  templateUrl: './apply-lyrics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLyricsShellComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ApplyLyricsShellComponent>, { optional: true });
  private readonly data: { albumId: number; historyId: number } = inject(MAT_DIALOG_DATA, { optional: true });

  private readonly albumStore = inject(AlbumStore);
  private readonly trackStore = inject(TrackStore);
  private readonly coverStore = inject(CoverStore);

  albumId = computed(() => this.data?.albumId ?? this.albumStore.selectedAlbumId?.());

  album = this.albumStore.selectedAlbum;

  tracksLoading = this.trackStore.loading;
  gettingMaTracks = this.trackStore.gettingMaTracks;
  
  lyricsLoading = computed(() => this.trackStore.tracks().some(t => t.lyricsLoading) || this.trackStore.maTracks().some(t => t.lyricsLoading));
  lyricsExpected = computed(() => (this.trackStore.tracks().filter(t => t.lyricsLoading).length + this.trackStore.maTracks().filter(t => t.lyricsLoading).length) > 0);
  lyricsLoadingProgress = computed(() => {
    const maTracks = this.trackStore.maTracks();
    const tracks = this.trackStore.tracks();
    
    const total = maTracks.length > 0 
      ? maTracks.filter(t => t.hasLyrics).length 
      : tracks.length;

    const loaded = maTracks.filter(t => t.lyricsChecked).length + tracks.filter(t => t.lyricsChecked).length;
    
    return Math.round((loaded / (total || 1)) * 100);
  });

  tracks = this.trackStore.tracks;
  maTracks = this.trackStore.maTracks;
  albumUrl = computed(() => this.albumStore.selectedAlbum()?.albumUrl);
  albumFolder = computed(() => this.albumStore.selectedAlbum()?.folder);
  coverLoading = computed(() => {
    const id = this.data?.albumId ?? this.albumStore.selectedAlbumId?.();
    return id ? this.coverStore.entityMap()[id]?.loading ?? false : false;
  });
  cover = computed(() => {
    const id = this.data?.albumId ?? this.albumStore.selectedAlbumId?.();
    return id ? this.coverStore.entityMap()[id]?.cover : undefined;
  });

  trackTransferring = computed(() => this.trackStore.tracks().some(t => t.trackTransferring));
  trackTransferringProgress = computed(() => {
    const total = this.trackStore.tracks().length;
    const transferred = this.trackStore.tracks().filter(t => !t.trackTransferring).length;
    return Math.round((transferred / (total || 1)) * 100);
  });
  
  applying = computed(() => this.trackStore.tracks().some(t => t.trackSaving));
  applyingProgress = computed(() => {
    const total = this.trackStore.tracks().length;
    const saved = this.trackStore.tracks().filter(t => !t.trackSaving).length;
    return Math.round((saved / (total || 1)) * 100);
  });

  showClose = !this.data?.historyId;
  applied = signal(false);

  ngOnInit(): void {
  }

  private lastAlbumFetchedId: number | null = null;
  private lastTracksFetchedAlbumId: number | null = null;
  private lastMaTracksFetchedAlbumId: number | null = null;
  private lastLyricsTriggeredAlbumId: number | null = null;
  private lastLocalLyricsTriggeredAlbumId: number | null = null;
  private lastCoverFetchedAlbumId: number | null = null;

  constructor() {
    if (this.data?.albumId) {
      this.albumStore.viewAlbum(this.data.albumId);
    }

    effect(() => {
      const album = this.album();
      if (album && this.lastAlbumFetchedId !== album.id) {
        this.lastAlbumFetchedId = album.id;
        this.albumStore.getAlbum(album.id);
      }
    });

    effect(() => {
      const album = this.album();
      if (album && this.lastTracksFetchedAlbumId !== album.id) {
        this.lastTracksFetchedAlbumId = album.id;
        this.trackStore.getTracks({ id: album.id, folder: album.folder || '' });
      }
    });

    effect(() => {
      const album = this.album();
      if (album?.albumUrl && this.lastMaTracksFetchedAlbumId !== album.id) {
        this.lastMaTracksFetchedAlbumId = album.id;
        this.trackStore.getMetalArchivesTracks({ url: album.albumUrl });
      }
    });

    // Album has a metal-archives url: drive lyrics from the metal-archives tracklist.
    effect(() => {
      const maTracks = this.maTracks();
      const tracks = this.tracks();
      const album = this.album();
      const albumId = this.albumId();

      if (maTracks?.length && tracks?.length && album && albumId && this.lastLyricsTriggeredAlbumId !== albumId) {
        this.lastLyricsTriggeredAlbumId = albumId;
        maTracks
          .filter((maTrack) => maTrack.hasLyrics && !maTrack.lyricsLoading)
          .forEach((maTrack, i) => {
            const localTrack = this.matchLocalTrack(tracks ?? [], maTrack);
            setTimeout(
              () => {
                if (localTrack) {
                  this.trackStore.getSyncedLyrics({
                        localTrackId: localTrack.id,
                        maTrackId: maTrack.id,
                        artist: album.artist ?? '',
                        track: localTrack.title ?? maTrack.title ?? '',
                        album: album.album ?? '',
                        durationSeconds: localTrack.duration || 0,
                  });
                } else {
                  this.trackStore.getLyrics({ trackId: maTrack.id });
                }
              },
              i * 3000,
            );
          });
      }
    });

    // Album has no metal-archives url: drive lyrics from the local mp3 tracks via LrcLib.
    effect(() => {
      const tracks = this.tracks();
      const album = this.album();
      const albumId = this.albumId();

      if (album && !album.albumUrl && tracks?.length && albumId && this.lastLocalLyricsTriggeredAlbumId !== albumId) {
        this.lastLocalLyricsTriggeredAlbumId = albumId;
        (tracks ?? [])
          .filter((track) => !track.lyricsLoading && !track.lyricsChecked)
          .forEach((track, i) => {
            setTimeout(
              () =>
                this.trackStore.getLocalLyrics({
                    localTrackId: track.id,
                    artist: album.artist ?? track.artist ?? '',
                    track: track.title ?? '',
                    album: album.album ?? track.album ?? '',
                    durationSeconds: track.duration || 0,
                }),
              i * 3000,
            );
          });
      }
    });

    effect(() => {
      const album = this.album();
      const cover = this.cover();

      if (album && !album.cover && !cover && this.lastCoverFetchedAlbumId !== album.id) {
        this.lastCoverFetchedAlbumId = album.id;
        this.coverStore.getCover({ id: album.id, folder: album.folder || '' });
      }
    });
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
        return { ...track };
      });

    if (tracksToSave.length) {
      this.trackStore.saveTracks({ tracks: tracksToSave });
    }

    this.albumStore.setHasLyrics({ id, hasLyrics: true });
    this.applied.set(true);
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
    tracks.forEach((track) => this.trackStore.transferTrack({ trackId: track.trackId }));
    this.albumStore.setTransferred({ id: tracks[0].id, transferred: true });
  }

  onDone() {
    this.dialogRef?.close({ id: this.data?.historyId, apply: this.applied() });
  }
}
