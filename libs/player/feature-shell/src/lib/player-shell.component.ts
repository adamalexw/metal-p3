import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { CoverComponent } from '@metal-p3/cover/ui';
import { PlayerStore } from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { PlayerControlsComponent } from '@metal-p3/player/ui';
import { PlaylistShellComponent } from '@metal-p3/playlist';
import { PlaylistStore } from '@metal-p3/playlist/data-access';
import { PlaylistComponent } from '@metal-p3/playlist/ui';
import { TrackService } from '@metal-p3/track/data-access';
import { EMPTY, Observable, catchError, fromEvent, map, tap } from 'rxjs';

@Component({
  imports: [CoverComponent, PlayerControlsComponent, PlaylistShellComponent, PlaylistComponent],
  selector: 'app-player',
  templateUrl: './player-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerShellComponent {
  private readonly trackService = inject(TrackService);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  private readonly audio = viewChild.required<ElementRef>('audio');

  protected readonly playerStore = inject(PlayerStore);
  protected readonly playlistStore = inject(PlaylistStore);

  divClass = computed(() => (this.playerStore.footerMode() ? 'max-h-[64px]' : 'flex flex-col lg:translate-y-0 lg:max-h-[calc(100vh-64px)]'));
  subDivClass = computed(() => (this.playerStore.footerMode() ? '' : 'flex-col lg:flex-row'));
  toggleIcon = computed(() => (this.playerStore.footerMode() ? 'expand_less' : 'expand_more'));
  coverSize = computed(() => (this.playerStore.footerMode() ? 'h-16 w-16' : 'w-screen lg:w-[18.5rem]'));

  elapsedTime = signal(0);

  private readonly defaultTitle = this.title.getTitle();

  constructor() {
    effect(() => {
      const item = this.playerStore.activePlaylistItem();
      if (item?.playing || item?.paused) {
        this.title.setTitle(`${item.artist} - ${item.title}`);
      } else {
        this.title.setTitle(this.defaultTitle);
      }
    });

    let currentId: string | undefined;

    effect(() => {
      const item = this.playerStore.activePlaylistItem();
      if (!item?.playing) {
        return;
      }

      // if we are reordering tracks we want to keep the current item playing
      if (item.id === currentId) {
        return;
      }

      currentId = item.id;

      if (item.url) {
        this.audioElement.src = item.url;
      } else {
        this.getBlobUrl(item.id, item.fullPath || '')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((url) => {
            if (url) this.audioElement.src = url;
          });
      }
    });

    this.setupMediaSession();

    afterNextRender(() => {
      this.listenToAudioEvents();
    });
  }

  /**
   * Wire the browser MediaSession API so the hardware media keys (play/pause,
   * next, previous) drive the player even when the window doesn't have focus —
   * Chromium/Edge deliver these to the page in the background. As a bonus it
   * surfaces the current track in the OS media overlay / lock screen.
   *
   * Only the dedicated transport keys are bound; no letter chords are claimed.
   */
  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    mediaSession.setActionHandler('play', () => this.onPlay());
    mediaSession.setActionHandler('pause', () => this.onPause());
    mediaSession.setActionHandler('nexttrack', () => this.onNext());
    mediaSession.setActionHandler('previoustrack', () => this.onMediaPrevious());

    effect(() => {
      const item = this.playerStore.activePlaylistItem();
      const cover = this.playerStore.activeItemCover();

      if (!item) {
        mediaSession.metadata = null;
        mediaSession.playbackState = 'none';
        return;
      }

      mediaSession.metadata = new MediaMetadata({
        title: item.title ?? '',
        artist: item.artist ?? '',
        album: item.album ?? '',
        artwork: cover ? [{ src: cover }] : [],
      });
      mediaSession.playbackState = item.playing ? 'playing' : item.paused ? 'paused' : 'none';
    });

    this.destroyRef.onDestroy(() => {
      (['play', 'pause', 'nexttrack', 'previoustrack'] as const).forEach((action) => mediaSession.setActionHandler(action, null));
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
    });
  }

  /**
   * Mirrors the on-screen previous button: restart the current track if we're
   * more than 5s in (or already on the first track), otherwise step back.
   */
  private onMediaPrevious(): void {
    if (this.audioElement.currentTime > 5 || this.playerStore.isFirstItemPlaying()) {
      this.onSeekTo(0);
    } else {
      this.onPrevious();
    }
  }

  onPlayItem(id: string) {
    this.playerStore.play(id);
  }

  private getBlobUrl(id: string, file: string): Observable<string> {
    return this.trackService.playTrack(file).pipe(
      map((response) => URL.createObjectURL(response)),
      tap((url) => this.playerStore.updateItem({ id, changes: { url, error: undefined } })),
      catchError((error) => {
        this.playerStore.updateItem({ id, changes: { error } });
        return EMPTY;
      }),
    );
  }

  private listenToAudioEvents() {
    fromEvent(this.audio().nativeElement, 'ended')
      .pipe(
        tap(() => {
          const playlist = this.playerStore.playlist();
          const currentIndex = playlist.findIndex((pl) => pl.playing);

          if (playlist.length === 1) {
            this.onSeekTo(0);
            this.playerStore.pause();
            return;
          }

          if (currentIndex === playlist.length - 1) {
            const id = playlist[0].id;
            this.playerStore.play(id);
            this.onPause();
            return;
          }

          if (currentIndex < playlist.length - 1) {
            const nextTrack = playlist[currentIndex + 1];
            this.onPlayItem(nextTrack.id);
            return;
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    fromEvent(this.audio().nativeElement, 'timeupdate')
      .pipe(
        tap(() => this.elapsedTime.set((this.audio().nativeElement as HTMLAudioElement).currentTime)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private get audioElement() {
    return this.audio().nativeElement as HTMLAudioElement;
  }

  onPlay() {
    const item = this.playerStore.activePlaylistItem();
    if (item) this.onPlayItem(item.id);

    this.audioElement.play();
  }

  onPause() {
    this.playerStore.pause();
    this.audioElement.pause();
  }

  onPrevious() {
    this.playerStore.playPrevious();
  }

  onNext() {
    this.playerStore.playNext();
  }

  onSeekTo(value: number) {
    this.audioElement.currentTime = value;
  }

  onRemove(id: string) {
    const item = this.playerStore.playlist().find((i) => i.id === id);
    if (item?.playlistItemId) {
      this.playlistStore.removeBackendItem(item.playlistItemId);
    }
    this.playerStore.remove(id);
  }

  onVolume(value: number) {
    this.audioElement.volume = value < 0 ? 0 : value;
  }

  onToogleView() {
    this.playerStore.toggleView();
  }

  onReorder(playlist: PlaylistItem[]) {
    this.playerStore.updateItems(playlist.map((item, index) => ({ id: item.id, changes: { index } })));
  }

  onClearPlaylist() {
    this.audioElement.src = '';
    this.playerStore.clear();
    this.playlistStore.clearActive();
  }

  onClosePlaylist() {
    this.onClearPlaylist();
    this.playerStore.close();
  }

  onTogglePlaylist() {
    this.playerStore.togglePlaylist();
  }
}
