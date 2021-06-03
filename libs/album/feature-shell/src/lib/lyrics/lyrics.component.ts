import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { getAlbum, getLyrics, getMaTracks, getTracks, saveTrack, selectAlbum, selectGettingMaTracks, selectMaTracks, selectRouteParams, selectTracks } from '@metal-p3/shared/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-lyrics-shell',
  templateUrl: './lyrics.component.html',
  styleUrls: ['./lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsShellComponent implements OnInit {
  album$ = this.store.pipe(select(selectAlbum));

  gettingMaTracks$ = this.store.pipe(select(selectGettingMaTracks));

  tracks$ = this.store.pipe(select(selectTracks));
  maTracks$ = this.store.pipe(select(selectMaTracks));

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.setState();
  }

  private setState(): void {
    this.album$
      .pipe(
        untilDestroyed(this),
        filter((album) => !album),
        take(1),
        withLatestFrom(this.store.pipe(select(selectRouteParams))),
        filter(([_id, params]) => params?.id),
        tap(([_id, params]) => this.store.dispatch(getAlbum({ id: params.id })))
      )
      .subscribe();

    combineLatest([this.album$, this.tracks$])
      .pipe(
        untilDestroyed(this),
        filter(([album, tracks]) => album && !tracks),
        map(([album]) => ({ id: album?.id, folder: album?.folder || '' })),
        take(1),
        tap(({ id, folder }) => this.store.dispatch(getTracks({ id, folder })))
      )
      .subscribe();

    combineLatest([this.album$, this.maTracks$])
      .pipe(
        untilDestroyed(this),
        filter(([album, maTracks]) => album?.albumUrl && !maTracks),
        map(([album]) => ({ id: album?.id, url: album?.albumUrl || '' })),
        take(1),
        tap(({ id, url }) => this.store.dispatch(getMaTracks({ id, url })))
      )
      .subscribe();

    this.maTracks$
      .pipe(
        filter((maTracks) => !!maTracks),
        withLatestFrom(this.store.pipe(select(selectRouteParams))),
        filter(([_maTracks, params]) => params?.id),
        tap(([maTracks, params]) => {
          maTracks?.filter((track) => !track.lyrics && track.hasLyrics).forEach((track) => this.store.dispatch(getLyrics({ id: params?.id, trackId: track.id })));
        }),
        take(1)
      )
      .subscribe();
  }

  onApply(id: number, lyrics: ApplyLyrics[]) {
    lyrics.map((track) => {
      if (track.maTrack?.lyrics) {
        this.store.dispatch(saveTrack({ id, track: { ...track, lyrics: this.formatLyrics(track.maTrack.lyrics) } }));
      }
    });
  }

  private formatLyrics(lyrics: string): string {
    return lyrics.replace(/<br \/>/gi, '');
  }
}
