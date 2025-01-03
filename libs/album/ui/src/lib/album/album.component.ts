import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, untracked } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDetailsForm, AlbumForm } from '@metal-p3/album/domain';
import { AlbumDto, BandProps, MetalArchivesAlbumTrack, MetalArchivesUrl, TrackBase } from '@metal-p3/api-interfaces';
import { CoverComponent } from '@metal-p3/cover/ui';
import { Album, AlbumWithoutTracks } from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Track, TracksForm } from '@metal-p3/track/domain';
import { TracksComponent, TracksToolbarComponent } from '@metal-p3/track/ui';
import { WINDOW } from '@ng-web-apis/common';
import { AlbumFormComponent } from '../album-form/album-form.component';
import { AlbumToolbarComponent } from '../album-toolbar/album-toolbar.component';

@Component({
  imports: [
    AlbumFormComponent,
    AlbumToolbarComponent,
    CoverComponent,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    ReactiveFormsModule,
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
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly windowRef = inject(WINDOW);
  private readonly notificationService = inject(NotificationService);

  album = input.required<Album | null>();
  albumSaving = input<boolean | null>(false);
  tracks = input<Track[] | null | undefined>([]);
  tracksLoading = input<boolean | null>(false);
  tracksError = input<string | null>();
  albumDuration = input<number | null>(0);
  trackSavingProgress = input<number | null>(0);
  coverLoading = input<boolean | null>(false);
  cover = input<string | null | undefined>();
  findingUrl = input<boolean | null>(false);
  maUrls = input<MetalArchivesUrl | null>(null);
  gettingMaTracks = input<boolean | null>(false);
  maTracks = input<MetalArchivesAlbumTrack[] | null | undefined>([]);
  trackRenaming = input<boolean | null>(false);
  trackRenamingProgress = input<number | null>(0);
  trackTransferring = input<boolean | null>(false);
  trackTransferringProgress = input<number | null>(0);
  renamingFolder = input<boolean | null>(false);
  renamingFolderError = input<string | null | undefined>();
  lyricsLoading = input<boolean | null>(false);
  gettingBandProps = input<boolean | null>(false);
  bandProps = input<BandProps | null | undefined>(null);

  readonly save = output<{
    album: AlbumWithoutTracks;
    tracks: TrackBase[];
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

  readonly lyrics = output<{
    id: number;
    url: string;
  }>();

  readonly trackNumbers = output<number>();

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

  readonly transferTrack = output<{
    id: number;
    trackId: number;
  }>();

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

  albumId = computed(() => this.album()?.id ?? 0);

  get albumUrl() {
    return this.details.controls.albumUrl;
  }

  get artistUrl() {
    return this.details.controls.artistUrl;
  }

  get hasLyrics() {
    return this.details.controls.hasLyrics;
  }

  private get details() {
    return this.form.controls.details;
  }

  private get genre() {
    return this.details.controls.genre;
  }

  private get country() {
    return this.details.controls.country;
  }

  form = this.fb.group<AlbumForm>({
    details: this.fb.group<AlbumDetailsForm>({
      artist: this.fb.control('', Validators.required),
      album: this.fb.control('', Validators.required),
      year: this.fb.control(0, Validators.required),
      genre: this.fb.control('', Validators.required),
      country: this.fb.control('', Validators.required),
      artistUrl: this.fb.control(undefined),
      albumUrl: this.fb.control(undefined),
      ignore: this.fb.control(false),
      transferred: this.fb.control(undefined),
      hasLyrics: this.fb.control(undefined),
      dateCreated: this.fb.control(''),
    }),
    tracks: this.fb.array<FormGroup<TracksForm>>([]),
  });

  constructor() {
    effect(() => {
      const albumId = this.albumId();

      if (albumId) {
        const album = untracked(this.album);

        if (album) {
          this.form.controls.details.patchValue(album);
        }
      }
    });

    effect(() => {
      const maUrls = this.maUrls();

      untracked(() => {
        const gettingBandProps = this.gettingBandProps() ?? false;

        if (maUrls) {
          this.setMaUrls(maUrls);

          if (maUrls.artistUrl && (!this.genre.value || !this.country.value) && !gettingBandProps) {
            this.getBandProps(maUrls.artistUrl);
          }
        }
      });
    });

    // prevent band genre and country from being overidden
    effect(() => {
      const bandProps = this.bandProps();

      if (bandProps) {
        this.setBandProps(bandProps);
      }
    });

    effect(() => {
      const renamingFolderError = this.renamingFolderError();

      if (renamingFolderError) {
        this.notificationService.showError(renamingFolderError, 'Rename Folder');
      }
    });
  }

  private setMaUrls(urls: MetalArchivesUrl) {
    this.artistUrl.setValue(urls.artistUrl);
    this.albumUrl.setValue(urls.albumUrl);
  }

  private setBandProps(props: BandProps) {
    this.genre.setValue(props.genre);
    this.country.setValue(props.country);
  }

  private getTracks(): TrackBase[] {
    const tracks = this.form.controls.tracks.value;

    if (tracks) {
      return tracks as TrackBase[];
    }

    return [];
  }

  onSave(): void {
    const { folder, fullPath } = this.album() as AlbumDto;
    const album = this.details.getRawValue();

    this.save.emit({
      album: {
        ...album,
        id: this.albumId(),
        folder,
        fullPath,
        bandId: this.album()?.bandId ?? 0,
        cover: this.cover() ?? '',
      },
      tracks: this.getTracks(),
    });
  }

  onImageSearch() {
    this.openLink(encodeURI(`https://google.com/images?q=${this.details.controls.artist.value} ${this.details.controls.album.value}`));
  }

  onFindUrl() {
    const { artist, album } = this.details.value;

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
    this.trackNumbers.emit(this.albumId());
  }

  onMaTracks() {
    if (this.albumUrl.value) {
      this.getMaTracks.emit({ id: this.albumId(), url: this.albumUrl.value });
    }
  }

  onLyrics() {
    if (this.albumUrl.value) {
      this.lyrics.emit({ id: this.albumId(), url: this.albumUrl.value });
    }
  }

  onRenameFolder() {
    const { artist, album } = this.details.value;

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

  onTransferAlbum() {
    const tracks = this.tracks();
    if (tracks?.length) {
      const transferTracks = tracks.map((track) => ({ id: this.albumId(), trackId: track.id }));
      this.transferAlbum.emit(transferTracks);
    }
  }

  onTransferTrack(trackId: number) {
    this.transferTrack.emit({ id: this.albumId(), trackId });
  }
}
