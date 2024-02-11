import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CoverComponent } from '@metal-p3/cover/ui';
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
  selectShowPlaylist,
} from '@metal-p3/player/data-access';
import { PlaylistItem } from '@metal-p3/player/domain';
import { PlayerControlsComponent } from '@metal-p3/player/ui';
import { PlaylistShellComponent } from '@metal-p3/playlist';
import { PlaylistComponent } from '@metal-p3/playlist/ui';
import { nonNullable } from '@metal-p3/shared/utils';
import { TrackService } from '@metal-p3/track/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Observable, fromEvent, iif, of } from 'rxjs';
import { concatMap, distinctUntilKeyChanged, filter, map, shareReplay, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  standalone: true,
  imports: [AsyncPipe, CoverComponent, PlayerControlsComponent, PlaylistShellComponent, PlaylistComponent],
  selector: 'app-player',
  templateUrl: './player-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerShellComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly trackService = inject(TrackService);
  private readonly title = inject(Title);

  @ViewChild('audio', { static: true }) audio!: ElementRef;

  playerOpen$ = this.store.select(selectPlayerOpen);

  footerMode$ = this.store.select(selectFooterMode).pipe(shareReplay());
  divClass$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'max-h-[64px]' : 'lg:translate-y-0 lg:max-h-[calc(100vh-64px)]')));
  subDivClass$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? '' : 'flex-col lg:flex-row')));
  toggleIcon$ = this.footerMode$.pipe(map((footerMode) => (footerMode ? 'expand_less' : 'expand_more')));

  playlist$ = this.store.select(selectPlaylist);
  activeItem$ = this.store.select(selectActivePlaylistItem);

  cover$ = this.store.select(selectActiveItemCover);
  coverSize$ = this.footerMode$.pipe(
    map((footerMode) => (footerMode ? { 'h-16': true, 'w-16': true } : { 'w-screen': true, 'lg:w-64': true, 'lg:h-64': true })),
    shareReplay(),
  );

  elapsedTime$: Observable<number> = of(0);
  ended$: Observable<boolean> = of(false);
  isFirstItemPlaying$ = this.store.select(selectFirstItemPlaying);
  isLastItemPlaying$ = this.store.select(selectLastItemPlaying);

  playlistDuration$ = this.store.select(selectPlaylistDuration);

  showPlaylist$ = this.store.select(selectShowPlaylist);

  constructor() {
    this.activeItem$
      .pipe(
        untilDestroyed(this),
        filter((item) => !!item?.playing),
        nonNullable(),
        tap(({ artist, title }) => this.title.setTitle(`${artist} - ${title}`)),
        distinctUntilKeyChanged('id'), // if we are reordering tracks we want to keep the current item playing
        concatMap((item) => iif(() => !!item?.url, of(item?.url), this.getBlobUrl(item?.id || '', item?.fullPath || ''))),
        tap((url) => {
          if (url) {
            this.audioElement.src = url;
          }
        }),
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.listenToAudioEvents();
  }

  onPlayItem(id: string) {
    this.store.dispatch(PlayerActions.play({ id }));
  }

  private getBlobUrl(id: string, file: string): Observable<string> {
    return this.trackService.playTrack(file).pipe(
      map((response) => URL.createObjectURL(response)),
      tap((url) => this.store.dispatch(PlayerActions.updateItem({ update: { id, changes: { url } } }))),
    );
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
        }),
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
        tap((item) => this.onPlayItem(item?.id || '')),
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
    this.title.setTitle('M(etal)p3');
  }

  onTogglePlaylist() {
    this.store.dispatch(PlayerActions.tooglePlaylist());
  }
}
