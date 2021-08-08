import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  clearBlobs,
  clearPlaylist,
  closePlayer,
  pauseItem,
  playItem,
  playNext,
  playPrevious,
  removeItem,
  reorderPlaylist,
  selectActiveItemCover,
  selectActivePlaylistItem,
  selectFirstItemPlaying,
  selectFooterMode,
  selectLastItemPlaying,
  selectPlayerOpen,
  selectPlaylist,
  selectPlaylistDuration,
  tooglePlayerView,
  updatePlaylistItem,
} from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { TrackService } from '@metal-p3/track/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { fromEvent, iif, Observable, of } from 'rxjs';
import { concatMap, distinctUntilKeyChanged, filter, map, shareReplay, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-player',
  templateUrl: './player-shell.component.html',
  styleUrls: ['./player-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerShellComponent implements OnInit {
  @ViewChild('audio', { static: true }) audio!: ElementRef;

  playerOpen$ = this.store.pipe(select(selectPlayerOpen));

  footerMode$ = this.store.pipe(select(selectFooterMode)).pipe(shareReplay());
  divClass$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'footer-mode' : 'full-mode overflow-hidden')));
  toggleIcon$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'expand_less' : 'expand_more')));

  playlist$ = this.store.pipe(select(selectPlaylist));
  activeItem$ = this.store.pipe(select(selectActivePlaylistItem));

  playingItem$ = this.activeItem$
    .pipe(
      untilDestroyed(this),
      filter((item) => !!item?.playing),
      distinctUntilKeyChanged('id'), // if we are reordering tracks we want to keep the current item playing
      concatMap((item) => iif(() => !!item?.url, of(item?.url), this.getBlobUrl(item?.id || '', item?.fullPath || ''))),
      tap((url) => {
        if (url) {
          this.audioElement.src = url;
        }
      })
    )
    .subscribe();

  cover$ = this.store.pipe(select(selectActiveItemCover));
  coverSize$ = this.footerMode$.pipe(
    map((footerMode) => (footerMode ? 64 : 256)),
    shareReplay()
  );

  elapsedTime$: Observable<number> = of(0);
  ended$: Observable<boolean> = of(false);
  isFirstItemPlaying$ = this.store.pipe(select(selectFirstItemPlaying));
  isLastItemPlaying$ = this.store.pipe(select(selectLastItemPlaying));

  playlistDuration$ = this.store.pipe(select(selectPlaylistDuration));

  constructor(private store: Store, private trackService: TrackService) {}

  ngOnInit(): void {
    this.listenToAudioEvents();
  }

  private getBlobUrl(id: string, file: string): Observable<string> {
    return this.trackService.playTrack(file).pipe(
      map((response) => URL.createObjectURL(response)),
      tap((url) => this.store.dispatch(updatePlaylistItem({ update: { id, changes: { url } } })))
    );
  }

  onPlayItem(id: string) {
    this.store.dispatch(playItem({ id }));
  }

  private listenToAudioEvents() {
    fromEvent(this.audio.nativeElement, 'ended')
      .pipe(
        untilDestroyed(this),
        withLatestFrom(this.playlist$),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tap(([_ended, playlist]) => {
          const currentIndex = playlist.findIndex((pl) => pl.playing);

          if (currentIndex < playlist.length - 1) {
            const nextTrack = playlist[currentIndex + 1];
            this.onPlayItem(nextTrack.id);
          }
        })
      )
      .subscribe();

    this.elapsedTime$ = fromEvent(this.audio.nativeElement, 'timeupdate').pipe(map(() => (this.audio.nativeElement as AudioContext).currentTime));
  }

  private get audioElement() {
    return this.audio.nativeElement as HTMLAudioElement;
  }

  onPlay() {
    this.activeItem$
      .pipe(
        take(1),
        tap((item) => this.onPlayItem(item?.id || ''))
      )
      .subscribe();

    this.audioElement.play();
  }

  onPause() {
    this.store.dispatch(pauseItem());
    this.audioElement.pause();
  }

  onPrevious() {
    this.store.dispatch(playPrevious());
  }

  onNext() {
    this.store.dispatch(playNext());
  }

  onSeekTo(value: number) {
    this.audioElement.currentTime = value;
  }

  onRemove(id: string) {
    this.store.dispatch(removeItem({ id }));
  }

  onVolume(value: number) {
    console.log('🚀 ~ file: player-shell.component.ts ~ line 147 ~ PlayerShellComponent ~ onVolume ~ value', value);
    this.audioElement.volume = value < 0 ? 0 : value;
  }

  onToogleView() {
    this.store.dispatch(tooglePlayerView());
  }

  onReorder(playlist: PlaylistItem[]) {
    this.store.dispatch(reorderPlaylist({ updates: playlist.map((item, index) => ({ id: item.id, changes: { index } })) }));
  }

  onClearPlaylist() {
    this.audioElement.src = '';
    this.store.dispatch(clearBlobs());
    this.store.dispatch(clearPlaylist());
  }

  onClosePlaylist() {
    this.onClearPlaylist();
    this.store.dispatch(closePlayer());
  }
}
