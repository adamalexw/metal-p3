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
import { NotificationService } from '@metal-p3/shared/feedback';
import { TrackStore } from '@metal-p3/track/data-access';
import { Track } from '@metal-p3/track/domain';
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
  private readonly notificationService = inject(NotificationService);
  private readonly playerService = inject(PlayerService);
  private readonly maintenanceStore = inject(MaintenanceStore);

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

  gettingBandProps = computed(() => false);
  bandProps = computed(() => {
    const bandId = this.albumStore.selectedAlbum()?.bandId;
    return bandId ? this.bandStore.entityMap()[bandId]?.props : undefined;
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

  onDownloadCover(id: number, url: string) {
    this.coverStore.downloadCover({ id, url });
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

  onFindUrl(id: number, artist: string, album: string) {
    this.albumStore.findMetalArchivesUrl({ id, artist, album });
  }

  onMaTracks(id: number, url: string) {
    const maTracks = this.getMaTracks(id, url);
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

  onLyrics(id: number): void {
    this.router.navigate(['maintenance', 'lyrics', id]);
  }

  onRenameTracks(id: number, tracks: Track[]) {
    tracks.forEach((track) => {
      this.trackStore.renameTrack({ track });
    });
  }

  onRenameFolder(id: number, src: string, artist: string, album: string) {
    this.albumStore.renameFolder({ id, src, artist, album });
  }

  onOpenFolder(id: number, folder: string) {
    this.albumStore.updateAlbum(id, { extraFiles: false });
    this.albumService.openFolder(folder).subscribe();
  }

  onLyricsPriority(albumId: number) {
    this.maintenanceStore.addLyricsPriority(albumId);
  }

  onRefreshTracks(id: number, folder: string) {
    this.trackStore.getTracks({ id, folder });
  }

  onFindBandProps(id: number, url: string) {
    const bandId = this.albumStore.selectedAlbum()?.bandId;
    const band = bandId ? this.bandStore.entityMap()[bandId] : undefined;
    if (!band) {
      this.bandStore.getProps({ id, url });
    }
  }

  onTransferAlbum(tracks: { id: number; trackId: number }[]) {
    tracks.forEach((track) => this.onTransferTrack(track.trackId));

    this.albumStore.setTransferred({ id: tracks[0].id, transferred: true });
  }

  onTransferTrack(trackId: number) {
    this.trackStore.transferTrack({ trackId });
  }

  onPlayAlbum(albumId: number) {
    this.playerService.playAlbum(albumId, this.trackStore.tracks());
  }

  onAddAlbumToPlaylist(albumId: number) {
    this.playerService.addAlbumToPlaylist(albumId, this.trackStore.tracks());
  }

  onPlayTrack(track: Track, albumId: number) {
    this.playerService.playTrack(track, albumId);
  }

  onAddTrackToPlaylist(track: Track, albumId: number) {
    this.playerService.addTrackToPlaylist(track, albumId);
  }

  onDeleteTrack(track: Track, albumId: number): void {
    this.trackStore.deleteTrack({ track });
  }

  onDeleteAlbum(id: number) {
    this.albumStore.deleteAlbum(id);
    this.router.navigate(['/']);
  }

  private getMaTracks(id: number, url: string): MetalArchivesAlbumTrack[] | undefined {
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
