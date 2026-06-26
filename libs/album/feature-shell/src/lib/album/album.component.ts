import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, numberAttribute } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AlbumService, AlbumStore } from '@metal-p3/album/data-access';
import { Album } from '@metal-p3/album/domain';
import { AlbumComponent } from '@metal-p3/album/ui';
import { MetalArchivesAlbumTrack, TrackBase } from '@metal-p3/api-interfaces';
import { BandStore } from '@metal-p3/band/data-access';
import { CoverService, CoverStore } from '@metal-p3/cover/data-access';
import { MaintenanceStore } from '@metal-p3/maintenance/data-access';
import { PlayerService } from '@metal-p3/player/data-access';
import { TrackStore } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
import { WA_WINDOW } from '@ng-web-apis/common';
import { map, tap } from 'rxjs';

@Component({
  imports: [RouterModule, AlbumComponent],
  selector: 'app-album-shell',
  templateUrl: './album.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumShellComponent {
  private readonly albumService = inject(AlbumService);
  private readonly coverService = inject(CoverService);
  private readonly router = inject(Router);
  private readonly playerService = inject(PlayerService);
  private readonly maintenanceStore = inject(MaintenanceStore);
  private readonly windowRef = inject(WA_WINDOW);

  readonly albumStore = inject(AlbumStore);
  readonly coverStore = inject(CoverStore);
  readonly trackStore = inject(TrackStore);
  readonly bandStore = inject(BandStore);

  readonly id = input.required({ transform: numberAttribute });

  album = this.albumStore.selectedAlbum;
  albumSaving = computed(() => this.albumStore.selectedAlbum()?.saving ?? false);

  tracksLoading = this.trackStore.loading;
  tracks = this.trackStore.tracks;
  tracksError = computed(() => this.trackStore.error?.() ?? undefined);
  albumDuration = this.trackStore.tracksDuration;

  trackSavingProgress = computed(() => {
    const tracks = this.trackStore.tracks();
    const total = tracks.length;
    const progress = tracks.filter((t) => t.trackSaving).length;
    return this.getProgress(total, progress);
  });

  coverState = computed(() => {
    const albumId = this.id();
    return this.coverStore.entityMap()[albumId];
  });
  coverLoading = computed(() => this.coverState()?.loading ?? false);
  coverError = computed(() => this.coverState()?.error);
  cover = computed(() => this.coverState()?.cover);

  findingUrl = computed(() => this.albumStore.selectedAlbum()?.findingUrl ?? false);
  maUrls = computed(() => {
    const album = this.albumStore.selectedAlbum();
    return album ? { albumUrl: album.albumUrl, artistUrl: album.artistUrl } : undefined;
  });

  trackRenaming = computed(() => this.trackStore.tracks().some((t) => t.trackRenaming));
  trackRenamingProgress = computed(() => {
    const tracks = this.trackStore.tracks();
    return this.getProgress(tracks.length, tracks.filter((t) => t.trackRenaming).length);
  });

  trackTransferring = computed(() => this.trackStore.tracks().some((t) => t.trackTransferring));
  trackTransferringProgress = computed(() => {
    const tracks = this.trackStore.tracks();
    return this.getProgress(tracks.length, tracks.filter((t) => t.trackTransferring).length);
  });

  renamingFolder = computed(() => this.albumStore.selectedAlbum()?.renamingFolder ?? false);
  renamingFolderError = computed(() => this.albumStore.selectedAlbum()?.renamingFolderError);

  lyricsLoading = computed(() => {
    const tracks = this.trackStore.tracks();
    const maTracks = this.trackStore.maTracks();
    const albumUrl = this.albumStore.selectedAlbum()?.albumUrl;

    if (!albumUrl) {
      return tracks.some((t) => t.lyricsLoading);
    }
    return maTracks.some((t) => t.lyricsLoading);
  });

  gettingMaTracks = this.trackStore.gettingMaTracks;
  maTracks = this.trackStore.maTracks;

  gettingBandProps = computed(() => {
    const albumId = this.id();
    return albumId ? this.bandStore.entityMap()[albumId]?.loading : false;
  });
  bandProps = computed(() => {
    const albumId = this.id();
    return albumId ? this.bandStore.entityMap()[albumId]?.props : undefined;
  });

  constructor() {
    effect(() => {
      const albumId = this.id();
      const selectedAlbumId = this.albumStore.selectedAlbumId?.();
      if (albumId && albumId !== selectedAlbumId) {
        this.albumStore.viewAlbum(albumId);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.albumStore.clearSelectedAlbum();
    });
  }

  onDownloadCover(url: string) {
    this.coverStore.downloadCover({ id: this.id(), url });
  }

  onImageSearchFromMa(url: string) {
    const album = this.albumStore.selectedAlbum();
    const fallback = () => {
      if (album?.artist && album?.album) {
        this.windowRef.open(encodeURI(`https://google.com/images?q=${album.artist} ${album.album}`), '_blank');
      }
    };
    this.coverStore.getCoverFromMetalArchives({ id: this.id(), url, fallback });
  }

  onSave(album: Album, tracks: TrackBase[], previousBandId?: number) {
    this.albumStore.saveAlbum({ album, previousBandId });

    if (album.cover) {
      this.coverService
        .getCoverDto(album.cover)
        .pipe(
          map((cover) => cover as string),
          tap((cover) => this.coverStore.saveCover({ id: album.id, folder: album.fullPath, cover })),
          tap((cover) => this.dispatchTracks({ ...album, cover }, tracks)),
        )
        .subscribe();
    } else {
      this.dispatchTracks(album, tracks);
    }
  }

  onFindUrl(artist: string, album: string) {
    this.albumStore.findMetalArchivesUrl({ id: this.id(), artist, album });
  }

  onMaTracks(url: string) {
    const maTracks = this.getMaTracks(url);
    const tracks = this.trackStore.tracks();

    if (maTracks && tracks) {
      const updates: { id: number; changes: Partial<Track> }[] = [];

      for (let index = 0; index < tracks.length; index++) {
        const track = tracks[index];
        const maTrack = maTracks[index];

        if (maTrack) {
          updates.push({ id: track.id, changes: { trackNumber: maTrack.trackNumber, title: maTrack.title } });
        }
      }

      this.trackStore.updateTracks({ updates });
    }
  }

  onTrackNumbers() {
    const tracks = this.trackStore.tracks();
    if (tracks) {
      const updates: { id: number; changes: Partial<Track> }[] = tracks.map((track, index) => ({ id: track.id, changes: { trackNumber: (index + 1).toString().padStart(2, '0') } }));
      this.trackStore.updateTracks({ updates });
    }
  }

  onLyrics(): void {
    this.router.navigate(['maintenance', 'lyrics', this.id()]);
  }

  onRenameTracks(tracks: Track[]) {
    tracks.forEach((track) => {
      this.trackStore.renameTrack({ track });
    });
  }

  onRenameFolder(src: string, artist: string, album: string) {
    this.albumStore.renameFolder({ id: this.id(), src, artist, album });
  }

  onOpenFolder(folder: string) {
    this.albumStore.updateAlbum(this.id(), { extraFiles: false });
    this.albumService.openFolder(folder).subscribe();
  }

  onLyricsPriority() {
    this.maintenanceStore.addLyricsPriority(this.id());
  }

  onRefreshAlbum() {
    this.coverStore.getCover({ id: this.id(), folder: this.album()?.folder ?? '' });
    this.albumStore.getAlbum(this.id());
  }

  onRefreshTracks(folder: string) {
    this.trackStore.getTracks({ id: this.id(), folder });
  }

  onFindBandProps(url: string) {
    this.bandStore.getProps({ id: this.id(), url });
  }

  onTransferAlbum(trackIds: number[]) {
    this.trackStore.transferAlbumTracks({ trackIds, albumId: this.id() });
  }

  onTransferTrack(trackId: number) {
    this.trackStore.transferTrack({ trackId });
  }

  onPlayAlbum() {
    this.playerService.playAlbum(this.id(), this.trackStore.tracks());
  }

  onAddAlbumToPlaylist() {
    this.playerService.addAlbumToPlaylist(this.id(), this.trackStore.tracks());
  }

  onPlayTrack(track: Track) {
    this.playerService.playTrack(track, this.id());
  }

  onAddTrackToPlaylist(track: Track) {
    this.playerService.addTrackToPlaylist(track, this.id());
  }

  onDeleteTrack(track: Track): void {
    this.trackStore.deleteTrack({ track });
  }

  onDeleteAlbum() {
    this.albumStore.deleteAlbum(this.id());
    this.router.navigate(['/']);
  }

  private getMaTracks(url: string): MetalArchivesAlbumTrack[] | undefined {
    if (!this.trackStore.maTracks().length && !this.trackStore.gettingMaTracks()) {
      this.trackStore.getMetalArchivesTracks({ url });
    }
    return this.trackStore.maTracks();
  }

  private dispatchTracks(album: Album, tracks: TrackBase[]) {
    tracks.forEach((albumTrack) => {
      const track = this.getTrack(album, albumTrack);
      this.trackStore.saveTrack({ track });
    });
  }

  private getTrack(album: Album, albumTrack: TrackBase): Track {
    const { artist, genre, year, country, artistUrl, albumUrl, cover } = album;
    const track: Track = { ...albumTrack, artist, genre, year, country, artistUrl, albumUrl, cover, album: album.album };
    return track;
  }

  private getProgress(total: number, progress: number): number {
    if (total === 0 || progress === 0) {
      return 0;
    }
    return Math.floor(((total - progress) / total) * 100);
  }
}
