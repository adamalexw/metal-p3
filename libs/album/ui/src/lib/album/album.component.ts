import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output, untracked } from '@angular/core';
import { applyEach, form, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { Album, AlbumDetailsForm, AlbumForm } from '@metal-p3/album/domain';
import { BandDto, BandProps, MetalArchivesAlbumTrack, MetalArchivesUrl, TrackBase } from '@metal-p3/api-interfaces';
import { CoverComponent } from '@metal-p3/cover/ui';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Track } from '@metal-p3/track/domain';
import { TracksComponent, TracksToolbarComponent } from '@metal-p3/track/ui';
import { WA_WINDOW } from '@ng-web-apis/common';
import { take } from 'rxjs';
import { AlbumFormComponent } from '../album-form/album-form.component';
import { AlbumToolbarComponent } from '../album-toolbar/album-toolbar.component';
import { BandIdentifyComponent } from './band-identify.component';

@Component({
  imports: [
    AlbumFormComponent,
    AlbumToolbarComponent,
    CoverComponent,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    RouterModule,
    TracksComponent,
    TracksToolbarComponent,
  ],
  selector: 'app-album',
  templateUrl: './album.component.html',
  host: {
    class: 'block h-screen lg:overflow-hidden',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumComponent {
  private readonly windowRef = inject(WA_WINDOW);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly album = input.required<Album>();
  readonly albumSaving = input(false);
  readonly tracks = input<Track[]>([]);
  readonly tracksLoading = input(false);
  readonly tracksError = input<string>();
  readonly albumDuration = input(0);
  readonly trackSavingProgress = input(0);
  readonly coverLoading = input(false);
  readonly coverError = input<string>();
  readonly cover = input<string>();
  readonly findingUrl = input(false);
  readonly maUrls = input<MetalArchivesUrl>();
  readonly gettingMaTracks = input(false);
  readonly maTracks = input<MetalArchivesAlbumTrack[]>([]);
  readonly trackRenaming = input(false);
  readonly trackRenamingProgress = input(0);
  readonly trackTransferring = input(false);
  readonly trackTransferringProgress = input(0);
  readonly renamingFolder = input(false);
  readonly renamingFolderError = input<string>();
  readonly lyricsLoading = input(false);
  readonly gettingBandProps = input(false);
  readonly bandProps = input<BandProps>();

  readonly save = output<{
    album: Album;
    tracks: TrackBase[];
    previousBandId?: number;
  }>();

  readonly coverUrl = output<{
    id: number;
    url: string;
  }>();

  readonly findUrl = output<{
    id: number;
    artist: string;
    album: string;
  }>();

  readonly getMaTracks = output<{
    id: number;
    url: string;
  }>();

  readonly lyrics = output<number>();
  readonly trackNumbers = output();

  readonly renameTracks = output<{
    id: number;
    tracks: Track[];
  }>();

  readonly renameFolder = output<{
    id: number;
    src: string;
    artist: string;
    album: string;
  }>();

  readonly openFolder = output<{
    id: number;
    folder: string;
  }>();

  readonly lyricsPriority = output<number>();

  readonly refreshTracks = output<{
    id: number;
    folder: string;
  }>();

  readonly findBandProps = output<{
    id: number;
    url: string;
  }>();

  readonly findCountry = output<{
    id: number;
    url: string;
  }>();

  readonly transferAlbum = output<
    {
      id: number;
      trackId: number;
    }[]
  >();

  readonly transferTrack = output<number>();
  readonly playAlbum = output<number>();
  readonly addAlbumToPlaylist = output<number>();

  readonly playTrack = output<{
    track: Track;
    albumId: number;
  }>();

  readonly addTrackToPlaylist = output<{
    track: Track;
    albumId: number;
  }>();

  readonly deleteTrack = output<{
    track: Track;
    albumId: number;
  }>();

  readonly deleteAlbum = output<number>();

  readonly albumId = computed(() => this.album()?.id ?? 0);
  readonly albumUrl = computed(() => this.model().details.albumUrl);

  protected readonly model = linkedSignal<
    {
      album: Album;
      tracks: Track[];
      maUrls: MetalArchivesUrl | undefined;
      bandProps: BandProps | undefined;
    },
    AlbumForm
  >({
    source: () => ({
      album: this.album(),
      tracks: this.tracks() ?? [],
      maUrls: this.maUrls(),
      bandProps: this.bandProps(),
    }),
    computation: (source, previous) => {
      if (previous && source.album?.saving) {
        return previous.value;
      }

      const { album, tracks, maUrls, bandProps } = source;

      const mapTracks = (trackList: Track[]) => trackList.map((track) => ({
        id: track.id,
        trackNumber: track.trackNumber,
        title: track.title,
        duration: track.duration ?? 0,
        bitrate: track.bitrate ?? 0,
        lyrics: track.lyrics ?? '',
        syncedLyrics: track.syncedLyrics ?? '',
        file: track.file,
        folder: track.folder,
        fullPath: track.fullPath,
      }));

      if (previous && previous.source.album?.id === source.album?.id) {
        return {
          ...previous.value,
          details: {
            ...previous.value.details,
            genre: bandProps?.genre ? bandProps.genre : previous.value.details.genre,
            country: bandProps?.country ? bandProps.country : previous.value.details.country,
            artistUrl: maUrls?.artistUrl ? maUrls.artistUrl : previous.value.details.artistUrl,
            albumUrl: maUrls?.albumUrl ? maUrls.albumUrl : previous.value.details.albumUrl,
          },
          tracks: source.tracks !== previous.source.tracks ? mapTracks(source.tracks) : previous.value.tracks,
        };
      }

      return {
        details: {
          artist: album?.artist ?? '',
          album: album?.album ?? '',
          year: album?.year ?? 0,
          genre: bandProps ? (bandProps.genre ?? '') : (album?.genre ?? ''),
          country: bandProps ? (bandProps.country ?? '') : (album?.country ?? ''),
          played: album?.played ?? false,
          artistUrl: maUrls ? (maUrls.artistUrl ?? '') : (album?.artistUrl ?? ''),
          albumUrl: maUrls ? (maUrls.albumUrl ?? '') : (album?.albumUrl ?? ''),
          ignore: album?.ignore ?? false,
          transferred: album?.transferred ?? false,
          hasLyrics: album?.hasLyrics ?? false,
          dateCreated: album?.dateCreated ?? '',
        },
        tracks: mapTracks(tracks),
      };
    },
  });

  protected readonly form = form(this.model, (path) => {
    required(path.details.artist);
    required(path.details.album);
    required(path.details.year);
    required(path.details.genre);
    required(path.details.country);
    applyEach(path.tracks, (track) => {
      required(track.trackNumber);
      required(track.title);
    });
  });

  private updateDetails(patch: Partial<AlbumDetailsForm>): void {
    this.model.update((m) => ({ ...m, details: { ...m.details, ...patch } }));
  }

  constructor() {

    effect(() => {
      const renamingFolderError = this.renamingFolderError();

      if (renamingFolderError) {
        this.notificationService.showError(renamingFolderError, 'Rename Folder');
      }
    });
  }

  onSave(bandId?: number): void {
    const currentAlbum = this.album();
    if (!currentAlbum) {
      return;
    }

    const { folder, fullPath } = currentAlbum;
    const album = this.model().details;

    const previousBandId = bandId !== undefined && bandId !== currentAlbum.bandId ? currentAlbum.bandId : undefined;

    this.save.emit({
      album: {
        ...album,
        id: this.albumId(),
        folder,
        fullPath,
        bandId: bandId ?? currentAlbum.bandId ?? 0,
        cover: this.cover() ?? '',
      },
      tracks: this.getTracks(),
      previousBandId,
    });
  }

  onImageSearch() {
    const { artist, album } = this.model().details;
    this.openLink(encodeURI(`https://google.com/images?q=${artist} ${album}`));
  }

  onFindUrl() {
    const { artist, album } = this.model().details;

    if (artist && album) {
      this.findUrl.emit({ id: this.albumId(), artist, album });
    }
  }

  onRenameTracks() {
    const tracks = this.getTracks();

    if (tracks.length) {
      this.renameTracks.emit({ id: this.albumId(), tracks });
    }
  }

  onTrackNumbers() {
    this.trackNumbers.emit();
  }

  onMaTracks() {
    if (this.albumUrl) {
      this.getMaTracks.emit({ id: this.albumId(), url: this.albumUrl() });
    }
  }

  onLyrics() {
    // Albums without a metal-archives url still get lyrics via LrcLib using the local tracks.
    this.lyrics.emit(this.albumId());
  }

  onRenameFolder() {
    const { artist, album } = this.model().details;

    if (artist && album) {
      this.renameFolder.emit({ id: this.albumId(), src: this.album()?.fullPath || '', artist, album });
    }
  }

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }

  getBandProps(url: string) {
    this.findBandProps.emit({ id: this.albumId(), url });
  }

  onIdentifyBand(): void {
    const artistName = this.model().details.artist;
    if (!artistName) return;

    this.dialog
      .open<BandIdentifyComponent, { name: string; bandId: number | undefined }, BandDto>(BandIdentifyComponent, {
        width: '600px',
        data: { name: artistName, bandId: this.album()?.bandId },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((band) => {
        if (band) {
          this.updateDetails({ country: band.country ?? '', genre: band.genre ?? '' });
          this.onSave(band.id);
        }
      });
  }

  onTransferAlbum() {
    const tracks = this.tracks();
    if (tracks?.length) {
      const transferTracks = tracks.map((track) => ({ id: this.albumId(), trackId: track.id }));
      this.transferAlbum.emit(transferTracks);
    }

    this.updateDetails({ transferred: true });
    this.setPlayed();
  }

  onTransferTrack(trackId: number) {
    this.transferTrack.emit(trackId);
  }

  onPlayAlbum(albumId: number) {
    this.playAlbum.emit(albumId);
    this.setPlayed();
  }

  onAddAlbumToPlaylist(albumId: number) {
    this.addAlbumToPlaylist.emit(albumId);
    this.setPlayed();
  }

  private setPlayed() {
    this.updateDetails({ played: true });
  }

  private getTracks(): TrackBase[] {
    return this.model().tracks;
  }
}
