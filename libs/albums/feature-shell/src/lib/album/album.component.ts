import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Album,
  AlbumsService,
  downloadCover,
  findMaUrl,
  getAlbum,
  getCover,
  getLyrics,
  getMaTracks,
  getTracks,
  saveAlbum,
  saveBand,
  saveTrack,
  selectAlbum,
  selectAlbumSaving,
  selectCover,
  selectCoverLoading,
  selectFindingUrl,
  selectGettingLyrics,
  selectGettingMaTracks,
  selectMaTracks,
  selectMaUrls,
  selectRenamingTracks,
  selectRouteParams,
  selectTracks,
  selectTracksLoading,
} from '@metal-p3/albums/data-access';
import { BandDto, Track } from '@metal-p3/api-interfaces';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, take, tap, withLatestFrom } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-album-shell',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumShellComponent implements OnInit {
  album$ = this.store.pipe(select(selectAlbum));
  albumSaving$ = this.store.pipe(select(selectAlbumSaving));

  tracksLoading$ = this.store.pipe(select(selectTracksLoading));
  tracks$ = this.store.pipe(select(selectTracks));

  coverLoading$ = this.store.pipe(select(selectCoverLoading));
  cover$ = this.store.pipe(select(selectCover));

  findingUrl$ = this.store.pipe(select(selectFindingUrl));
  maUrls$ = this.store.pipe(select(selectMaUrls));

  renamingTracks$ = this.store.pipe(select(selectRenamingTracks));

  gettingLyrics$ = this.store.pipe(select(selectGettingLyrics));

  gettingMaTracks$ = this.store.pipe(select(selectGettingMaTracks));
  maTracks$ = this.store.pipe(select(selectMaTracks));

  constructor(private readonly store: Store, private readonly service: AlbumsService, private readonly router: Router) {}

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
        filter(([album, tracks]) => album && !album.tracks && !tracks),
        map(([album]) => ({ id: album?.id, folder: album?.folder })),
        take(1),
        tap(({ id, folder }) => this.store.dispatch(getTracks({ id, folder })))
      )
      .subscribe();

    combineLatest([this.album$, this.cover$])
      .pipe(
        untilDestroyed(this),
        filter(([album, cover]) => album && !album.cover && !cover),
        map(([album]) => ({ id: album?.id, folder: album?.folder })),
        take(1),
        tap(({ id, folder }) => this.store.dispatch(getCover({ id, folder })))
      )
      .subscribe();
  }

  onDownloadCover(id: number, url: string) {
    this.store.dispatch(downloadCover({ id, url }));
  }

  onSave(album: Album, tracks: Track[]) {
    this.store.dispatch(saveBand({ band: this.getBandDto(album) }));
    this.store.dispatch(saveAlbum({ album }));

    tracks.forEach((albumTrack) => {
      const track = this.getTrack(album, albumTrack);
      this.store.dispatch(saveTrack({ id: album.id, track }));
    });
  }

  private getTrack(album: Album, albumTrack: Track): Track {
    const { artist, genre, year, artistUrl, albumUrl, cover } = album;
    const track = { ...albumTrack, artist, genre, year, artistUrl, albumUrl, cover, album: album.album };
    return track;
  }

  private getBandDto(album: Album): BandDto {
    return {
      id: album.bandId,
      name: album.artist || '',
      country: album.country,
      genre: album.genre,
      metalArchiveUrl: album.artistUrl,
    };
  }

  onFindUrl(id: number, artist: string, album: string) {
    this.store.dispatch(findMaUrl({ id, artist, album }));
  }

  onMaTracks(id: number, url: string) {
    this.store.dispatch(getMaTracks({ id, url }));
  }

  onLyrics(id: number, url: string): void {
    this.maTracks$
      .pipe(
        tap((maTracks) => {
          if (!maTracks) {
            this.onMaTracks(id, url);
          }
        }),
        filter((maTracks) => !!maTracks),
        tap((maTracks) => {
          maTracks?.filter((track) => track.hasLyrics).forEach((track) => this.store.dispatch(getLyrics({ id, trackId: track.id })));
        }),
        tap(() => this.router.navigate(['album', 'lyrics', id])),
        take(1)
      )
      .subscribe();
  }

  onOpenFolder(folder: string) {
    this.service.openFolder(folder).subscribe();
  }

  onRefreshTracks(id: number, folder: string) {
    this.store.dispatch(getTracks({ id, folder }));
  }
}
