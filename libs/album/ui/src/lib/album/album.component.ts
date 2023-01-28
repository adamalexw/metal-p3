import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { AlbumDataAccessModule } from '@metal-p3/album/data-access';
import { AlbumDto, BandProps, MetalArchivesAlbumTrack, MetalArchivesUrl, TrackBase } from '@metal-p3/api-interfaces';
import { CoverComponent } from '@metal-p3/cover/ui';
import { Album, AlbumWithoutTracks } from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Track, tracksFormArray } from '@metal-p3/track/domain';
import { TracksComponent, TracksToolbarComponent } from '@metal-p3/track/ui';
import { WINDOW } from '@ng-web-apis/common';
import { AlbumFormComponent } from '../album-form/album-form.component';
import { AlbumToolbarComponent } from '../album-toolbar/album-toolbar.component';

@Component({
  standalone: true,
  imports: [
    NgIf,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AlbumFormComponent,
    AlbumDataAccessModule,
    AlbumToolbarComponent,
    CoverComponent,
    TracksToolbarComponent,
    TracksComponent,
    MatProgressBarModule,
    MatListModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
  ],
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumComponent implements OnChanges {
  @Input()
  album: Album | null | undefined;

  @Input()
  albumSaving: boolean | null = false;

  @Input()
  tracks: Track[] | null | undefined = [];

  @Input()
  tracksLoading: boolean | null = false;

  @Input()
  tracksError: string | null | undefined;

  @Input()
  albumDuration: number | null = 0;

  @Input()
  trackSavingProgress: number | null = 0;

  @Input()
  coverLoading: boolean | null = false;

  @Input()
  cover: string | null | undefined;

  @Input()
  findingUrl: boolean | null = false;

  @Input()
  maUrls: MetalArchivesUrl | null = null;

  @Input()
  gettingMaTracks: boolean | null = false;

  @Input()
  maTracks: MetalArchivesAlbumTrack[] | null | undefined = [];

  @Input()
  trackRenaming: boolean | null = false;

  @Input()
  trackRenamingProgress: number | null = 0;

  @Input()
  trackTransferring: boolean | null = false;

  @Input()
  trackTransferringProgress: number | null = 0;

  @Input()
  renamingFolder: boolean | null = false;

  @Input()
  renamingFolderError: string | null | undefined;

  @Input()
  lyricsLoading: boolean | null = false;

  @Input()
  gettingBandProps: boolean | null = false;

  @Input()
  bandProps: BandProps | null | undefined = null;

  @Output()
  readonly save = new EventEmitter<{ album: AlbumWithoutTracks; tracks: TrackBase[] }>();

  @Output()
  readonly coverUrl = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly findUrl = new EventEmitter<{ id: number; artist: string; album: string }>();

  @Output()
  readonly getMaTracks = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly lyrics = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly trackNumbers = new EventEmitter<number>();

  @Output()
  readonly renameTracks = new EventEmitter<{ id: number; tracks: Track[] }>();

  @Output()
  readonly renameFolder = new EventEmitter<{ id: number; src: string; artist: string; album: string }>();

  @Output()
  readonly openFolder = new EventEmitter<{ id: number; folder: string }>();

  @Output()
  readonly lyricsPriority = new EventEmitter<number>();

  @Output()
  readonly refreshTracks = new EventEmitter<{ id: number; folder: string }>();

  @Output()
  readonly findBandProps = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly findCountry = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly transferAlbum = new EventEmitter<{ id: number; trackId: number }[]>();

  @Output()
  readonly transferTrack = new EventEmitter<{ id: number; trackId: number }>();

  @Output()
  readonly playAlbum = new EventEmitter<number>();

  @Output()
  readonly addAlbumToPlaylist = new EventEmitter<number>();

  @Output()
  readonly playTrack = new EventEmitter<{ track: Track; albumId: number }>();

  @Output()
  readonly addTrackToPlaylist = new EventEmitter<{ track: Track; albumId: number }>();

  @Output()
  readonly deleteTrack = new EventEmitter<{ track: Track; albumId: number }>();

  @Output()
  readonly deleteAlbum = new EventEmitter<number>();

  @HostBinding('class') class = 'block h-screen overflow-hidden';

  get albumUrl(): string | undefined {
    return this.form.get('albumUrl')?.value;
  }

  get artistUrl(): string | undefined {
    return this.form.get('artistUrl')?.value;
  }

  get hasLyrics(): boolean {
    return this.form.get('hasLyrics')?.value ?? false;
  }

  form = this.fb.group({
    artist: ['', Validators.required],
    album: ['', Validators.required],
    year: [0, Validators.required],
    genre: [undefined as string | undefined, Validators.required],
    country: [undefined as string | undefined, Validators.required],
    artistUrl: [undefined as string | undefined],
    albumUrl: [undefined as string | undefined],
    ignore: [false],
    transferred: [undefined as boolean | undefined],
    hasLyrics: [undefined as boolean | undefined],
    dateCreated: [''],
    tracks: this.fb.array<typeof tracksFormArray>([]),
  });

  shouldCheckBandProps = false;

  constructor(private readonly fb: NonNullableFormBuilder, @Inject(WINDOW) readonly windowRef: Window, private notificationService: NotificationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.album && changes.album.currentValue && (changes.album.previousValue ? changes.album.currentValue.id !== changes.album.previousValue.id : !changes.album.previousValue)) {
      const { tracks: _tracks, maTracks: _maTracks, ...rest } = changes.album.currentValue;
      this.patchForm(rest);
    }

    if (changes.maUrls && this.maUrls) {
      this.setMaUrls(this.maUrls);

      if (this.shouldCheckBandProps && this.maUrls.artistUrl) {
        this.checkBandProps(this.maUrls.artistUrl);
        this.shouldCheckBandProps = false;
      }
    }

    if (changes.bandProps && this.bandProps) {
      this.setBandProps(this.bandProps);
    }

    if (changes.renamingFolderError && this.renamingFolderError) {
      this.notificationService.showError(this.renamingFolderError, 'Rename Folder');
    }
  }

  private patchForm(album: AlbumWithoutTracks) {
    this.form.patchValue(album);
  }

  private setMaUrls(urls: MetalArchivesUrl) {
    this.form.get('artistUrl')?.setValue(urls.artistUrl);
    this.form.get('albumUrl')?.setValue(urls.albumUrl);
  }

  private checkBandProps(artistUrl: string | undefined) {
    if (artistUrl && (!this.form.get('genre')?.value || !this.form.get('country')?.value)) {
      this.findBandProps.emit({ id: this.albumId, url: artistUrl });
    }
  }

  private setBandProps(props: BandProps) {
    this.form.get('genre')?.setValue(props.genre);
    this.form.get('country')?.setValue(props.country);
  }

  private getTracks(): TrackBase[] {
    const tracks = this.form.value.tracks;

    if (tracks) {
      return tracks as unknown as TrackBase[];
    }

    return [];
  }

  onSave(): void {
    const { folder, fullPath } = this.album as AlbumDto;
    const { tracks: _tracks, ...album } = this.form.getRawValue();

    this.save.emit({
      album: {
        ...album,
        id: this.album?.id ?? 0,
        folder,
        fullPath,
        bandId: this.album?.bandId ?? 0,
        cover: this.cover ?? '',
      },
      tracks: this.getTracks(),
    });
  }

  get albumId(): number {
    return this.album?.id || 0;
  }

  onImageSearch() {
    this.openLink(encodeURI(`https://google.com/images?q=${this.form.get('artist')?.value} ${this.form.get('album')?.value}`));
  }

  onFindUrl() {
    const { artist, album } = this.form.value;

    if (artist && album) {
      this.shouldCheckBandProps = true;
      this.findUrl.emit({ id: this.albumId, artist, album });
    }
  }

  onRenameTracks() {
    const tracks = this.getTracks();

    if (tracks.length) {
      this.renameTracks.emit({ id: this.albumId, tracks });
    }
  }

  onTrackNumbers() {
    this.trackNumbers.emit(this.albumId);
  }

  onMaTracks() {
    if (this.albumUrl) {
      this.getMaTracks.emit({ id: this.albumId, url: this.albumUrl });
    }
  }

  onLyrics() {
    if (this.albumUrl) {
      this.lyrics.emit({ id: this.albumId, url: this.albumUrl });
    }
  }

  onRenameFolder() {
    const { artist, album } = this.form.value;

    if (artist && album) {
      this.renameFolder.emit({ id: this.albumId, src: this.album?.fullPath || '', artist, album });
    }
  }

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }

  getBandProps(url: string) {
    this.findBandProps.emit({ id: this.albumId, url });
  }

  onTransferAlbum() {
    if (this.tracks) {
      const tracks = this.tracks.map((track) => ({ id: this.albumId, trackId: track.id }));
      this.transferAlbum.emit(tracks);
    }
  }

  onTransferTrack(trackId: number) {
    this.transferTrack.emit({ id: this.albumId, trackId });
  }
}
