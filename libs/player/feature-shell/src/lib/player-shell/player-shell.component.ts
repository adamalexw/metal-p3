import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  clearPlaylist,
  pauseItem,
  playItem,
  playNext,
  playPrevious,
  selectActivePlaylistItem,
  selectFirstItemPlaying,
  selectFooterMode,
  selectLastItemPlaying,
  selectPlaylist,
  tooglePlayerView,
  updatePlaylistItem,
} from '@metal-p3/player/data-access';
import { selectAlbumById } from '@metal-p3/shared/data-access';
import { TrackService } from '@metal-p3/track/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { fromEvent, iif, Observable, of } from 'rxjs';
import { concatMap, filter, map, shareReplay, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-player',
  templateUrl: './player-shell.component.html',
  styleUrls: ['./player-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerShellComponent implements OnInit {
  @ViewChild('audio', { static: true }) audio!: ElementRef;

  playlistActive$ = this.store.pipe(
    select(selectPlaylist),
    map((playlist) => playlist?.length)
  );
  footerMode$ = this.store.pipe(select(selectFooterMode)).pipe(shareReplay());
  divClass$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'footer-mode' : 'full-mode')));
  toggleIcon$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'expand_less' : 'expand_more')));

  playlist$ = this.store.pipe(select(selectPlaylist));
  activeItem$ = this.store.pipe(select(selectActivePlaylistItem));

  playingItem$ = this.activeItem$.pipe(
    filter((item) => !!item?.playing),
    concatMap((item) => iif(() => !!item?.url, of(item?.url), this.getBlobUrl(item?.id || '', item?.fullPath || '')))
  );

  cover$ = this.activeItem$.pipe(
    switchMap((item) => this.store.pipe(select(selectAlbumById(item?.albumId || 0)))),
    map((album) => album?.cover)
  );
  coverSize$ = this.footerMode$.pipe(
    map((footerMode) => (footerMode ? 64 : 256)),
    shareReplay()
  );

  elapsedTime$: Observable<number> = of(0);
  ended$: Observable<boolean> = of(false);
  isFirstItemPlaying$ = this.store.pipe(select(selectFirstItemPlaying));
  isLastItemPlaying$ = this.store.pipe(select(selectLastItemPlaying));

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

  onToogleView() {
    this.store.dispatch(tooglePlayerView());
  }

  onClearPlaylist() {
    this.store.dispatch(clearPlaylist());
  }
}
