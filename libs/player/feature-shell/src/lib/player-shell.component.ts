import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, afterNextRender, inject, viewChild, computed } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { CoverComponent } from '@metal-p3/cover/ui';
import { PlayerStore } from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { PlayerControlsComponent } from '@metal-p3/player/ui';
import { PlaylistShellComponent } from '@metal-p3/playlist';
import { PlaylistStore } from '@metal-p3/playlist/data-access';
import { PlaylistComponent } from '@metal-p3/playlist/ui';
import { selectAlbumFolder } from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { nonNullable } from '@metal-p3/shared/utils';
import { TrackService } from '@metal-p3/track/data-access';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, catchError, combineLatest, concatMap, distinctUntilChanged, distinctUntilKeyChanged, filter, fromEvent, map, of, tap, take } from 'rxjs';

@Component({
  imports: [AsyncPipe, CoverComponent, PlayerControlsComponent, PlaylistShellComponent, PlaylistComponent],
  selector: 'app-player',
  templateUrl: './player-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerShellComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly trackService = inject(TrackService);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationService);

  private readonly audio = viewChild.required<ElementRef>('audio');

  protected readonly playerStore = inject(PlayerStore);
  protected readonly playlistStore = inject(PlaylistStore);

  activeItem$ = toObservable(this.playerStore.activePlaylistItem);
  activeCover$ = toObservable(this.playerStore.activeItemCover);

  divClass = computed(() => (this.playerStore.footerMode() ? 'max-h-[64px]' : 'lg:translate-y-0 lg:max-h-[calc(100vh-64px)]'));
  subDivClass = computed(() => (this.playerStore.footerMode() ? '' : 'flex-col lg:flex-row'));
  toggleIcon = computed(() => (this.playerStore.footerMode() ? 'expand_less' : 'expand_more'));
  coverSize = computed(() => (this.playerStore.footerMode() ? 'h-16 w-16' : 'w-screen lg:w-[18.5rem]'));

  elapsedTime$: Observable<number> = of(0);

  private readonly defaultTitle = this.title.getTitle();

  constructor() {
    combineLatest([this.activeItem$, this.store.select(selectAlbumFolder)])
      .pipe(
        map(([item, folder]) => {
          if (item?.playing || item?.paused) return `${item.artist} - ${item.title}`;
          return folder ?? this.defaultTitle;
        }),
        distinctUntilChanged(),
        tap((t) => this.title.setTitle(t)),
        takeUntilDestroyed(),
      )
      .subscribe();

    afterNextRender(() => {
      this.activeItem$
        .pipe(
          filter((item) => !!item?.playing),
          nonNullable(),
          distinctUntilKeyChanged('id'), // if we are reordering tracks we want to keep the current item playing
          concatMap((item) => (item?.url ? of(item.url) : this.getBlobUrl(item?.id || '', item?.fullPath || ''))),
          tap((url) => {
            if (url) {
              this.audioElement.src = url;
            }
          }),
          takeUntilDestroyed(this.destroyRef),
          catchError((error) => {
            console.error(error);
            this.notificationService.showError(`Error playing track ${JSON.stringify(error)}`, 'Close');
            return EMPTY;
          }),
        )
        .subscribe();
    });
  }

  ngOnInit(): void {
    this.listenToAudioEvents();
    this.setupMediaSession();
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

    combineLatest([this.activeItem$, this.activeCover$])
      .pipe(
        tap(([item, cover]) => {
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
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.destroyRef.onDestroy(() => {
      (['play', 'pause', 'nexttrack', 'previoustrack'] as const).forEach((action) => mediaSession.setActionHandler(action, null));
      mediaSession.metadata = null;
      mediaSession.playbackState = 'none';
    });
  }

  /**
   * Mirrors the on-screen previous button: restart the current track if we're
   * more than 10s in (or already on the first track), otherwise step back.
   */
  private onMediaPrevious(): void {
    if (this.audioElement.currentTime > 10 || this.playerStore.isFirstItemPlaying()) {
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

    this.elapsedTime$ = fromEvent(this.audio().nativeElement, 'timeupdate').pipe(map(() => (this.audio().nativeElement as AudioContext).currentTime));
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
    const item = this.playerStore.playlist().find(i => i.id === id);
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
