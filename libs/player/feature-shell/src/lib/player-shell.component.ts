import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  PlayerActions,
  selectActiveItemCover,
  selectActivePlaylistItem,
  selectFirstItemPlaying,
  selectFooterMode,
  selectLastItemPlaying,
  selectPlayerOpen,
  selectPlaylist,
  selectPlaylistDuration,
} from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { nonNullable } from '@metal-p3/shared/utils';
import { TrackService } from '@metal-p3/track/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
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

  playerOpen$ = this.store.select(selectPlayerOpen);

  footerMode$ = this.store.select(selectFooterMode).pipe(shareReplay());
  divClass$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'footer-mode' : 'full-mode overflow-hidden')));
  toggleIcon$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'expand_less' : 'expand_more')));

  playlist$ = this.store.select(selectPlaylist);
  activeItem$ = this.store.select(selectActivePlaylistItem);

  playingItem$ = this.activeItem$
    .pipe(
      untilDestroyed(this),
      filter((item) => !!item?.playing),
      nonNullable(),
      distinctUntilKeyChanged('id'), // if we are reordering tracks we want to keep the current item playing
      concatMap((item) => iif(() => !!item?.url, of(item?.url), this.getBlobUrl(item?.id || '', item?.fullPath || ''))),
      tap((url) => {
        if (url) {
          this.audioElement.src = url;
        }
      })
    )
    .subscribe();

  cover$ = this.store.select(selectActiveItemCover);
  coverSize$ = this.footerMode$.pipe(
    map((footerMode) => (footerMode ? 64 : 256)),
    shareReplay()
  );

  elapsedTime$: Observable<number> = of(0);
  ended$: Observable<boolean> = of(false);
  isFirstItemPlaying$ = this.store.select(selectFirstItemPlaying);
  isLastItemPlaying$ = this.store.select(selectLastItemPlaying);

  playlistDuration$ = this.store.select(selectPlaylistDuration);

  constructor(private store: Store, private trackService: TrackService) {}

  ngOnInit(): void {
    this.listenToAudioEvents();
  }

  private getBlobUrl(id: string, file: string): Observable<string> {
    return this.trackService.playTrack(file).pipe(
      map((response) => URL.createObjectURL(response)),
      tap((url) => this.store.dispatch(PlayerActions.updateItem({ update: { id, changes: { url } } })))
    );
  }

  onPlayItem(id: string) {
    this.store.dispatch(PlayerActions.play({ id }));
  }

  private listenToAudioEvents() {
    fromEvent(this.audio.nativeElement, 'ended')
      .pipe(
        untilDestroyed(this),
        withLatestFrom(this.playlist$),
        tap(([_ended, playlist]) => {
          const currentIndex = playlist.findIndex((pl) => pl.playing);

          if (playlist.length === 1) {
            this.onSeekTo(0);
            this.store.dispatch(PlayerActions.pause());
            return;
          }

          if (currentIndex === playlist.length - 1) {
            const id = playlist[0].id;
            this.store.dispatch(PlayerActions.play({ id }));
            this.onPause();
            return;
          }

          if (currentIndex < playlist.length - 1) {
            const nextTrack = playlist[currentIndex + 1];
            this.onPlayItem(nextTrack.id);
            return;
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
    this.store.dispatch(PlayerActions.pause());
    this.audioElement.pause();
  }

  onPrevious() {
    this.store.dispatch(PlayerActions.playPrevious());
  }

  onNext() {
    this.store.dispatch(PlayerActions.playNext());
  }

  onSeekTo(value: number) {
    this.audioElement.currentTime = value;
  }

  onRemove(id: string) {
    this.store.dispatch(PlayerActions.remove({ id }));
  }

  onVolume(value: number) {
    this.audioElement.volume = value < 0 ? 0 : value;
  }

  onToogleView() {
    this.store.dispatch(PlayerActions.toogleView());
  }

  onReorder(playlist: PlaylistItem[]) {
    this.store.dispatch(PlayerActions.reorder({ updates: playlist.map((item, index) => ({ id: item.id, changes: { index } })) }));
  }

  onClearPlaylist() {
    this.audioElement.src = '';
    this.store.dispatch(PlayerActions.clear());
  }

  onClosePlaylist() {
    this.onClearPlaylist();
    this.store.dispatch(PlayerActions.close());
  }
}
