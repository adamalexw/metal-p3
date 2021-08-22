import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlbumDto, BandProps, MetalArchivesAlbumTrack, MetalArchivesUrl } from '@metal-p3/api-interfaces';
import { Album, AlbumWithoutTracks } from '@metal-p3/shared/data-access';
import { NotificationService } from '@metal-p3/shared/feedback';
import { Track } from '@metal-p3/track/domain';
import { WINDOW } from '@ng-web-apis/common';

@Component({
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
  readonly save = new EventEmitter<{ album: Album; tracks: Track[] }>();

  @Output()
  readonly coverUrl = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly findUrl = new EventEmitter<{ id: number; artist: string; album: string }>();

  @Output()
  readonly getMaTracks = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly lyrics = new EventEmitter<{ id: number; url: string }>();

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

  @Output()
  readonly closeAlbum = new EventEmitter<void>();

  @HostBinding('class') class = 'block h-screen overflow-hidden';

  get albumUrl(): string {
    return this.form.get('albumUrl')?.value;
  }

  get artistUrl(): string {
    return this.form.get('artistUrl')?.value;
  }

  get hasLyrics(): boolean {
    return this.form.get('hasLyrics')?.value;
  }

  form: FormGroup;

  constructor(fb: FormBuilder, @Inject(WINDOW) readonly windowRef: Window, private notificationService: NotificationService) {
    this.form = fb.group({
      artist: [],
      album: [],
      year: [],
      genre: [],
      country: [],
      artistUrl: [],
      albumUrl: [],
      ignore: [false],
      transferred: [],
      hasLyrics: [],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.album && changes.album.currentValue && (changes.album.previousValue ? changes.album.currentValue.id !== changes.album.previousValue.id : !changes.album.previousValue)) {
      const { tracks: _tracks, maTracks: _maTracks, ...rest } = changes.album.currentValue;
      this.patchForm(rest);
    }

    if (changes.maUrls && this.maUrls?.albumUrl) {
      this.setMaUrls(this.maUrls);
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

    this.checkBandProps(urls.artistUrl);
  }

  private checkBandProps(artistUrl: string | undefined) {
    if (artistUrl && (!this.form.get('genre')?.value || this.form.get('country')?.value)) {
      this.findBandProps.emit({ id: this.albumId, url: artistUrl });
    }
  }

  private setBandProps(props: BandProps) {
    this.form.get('genre')?.setValue(props.genre);
    this.form.get('country')?.setValue(props.country);
  }

  onSave(): void {
    const { folder, fullPath } = this.album as AlbumDto;
    const { tracks: _tracks, ...album } = this.form.getRawValue();

    this.save.emit({
      album: {
        ...album,
        id: this.album?.id,
        folder,
        fullPath,
        bandId: this.album?.bandId,
        cover: this.cover,
      },
      tracks: this.form.get('tracks')?.value,
    });
  }

  get albumId(): number {
    return this.album?.id || 0;
  }

  onImageSearch() {
    this.openLink(encodeURI(`https://google.com/images?q=${this.form.get('artist')?.value} ${this.form.get('album')?.value}`));
  }

  onFindUrl() {
    this.findUrl.emit({ id: this.albumId, artist: this.form.get('artist')?.value, album: this.form.get('album')?.value });
  }

  onMaTracks() {
    this.getMaTracks.emit({ id: this.albumId, url: this.albumUrl });
  }

  onLyrics() {
    this.lyrics.emit({ id: this.albumId, url: this.albumUrl });
  }

  onRenameTracks() {
    this.renameTracks.emit({ id: this.albumId, tracks: this.form.get('tracks')?.value });
  }

  onRenameFolder() {
    this.renameFolder.emit({ id: this.albumId, src: this.album?.fullPath || '', artist: this.form.get('artist')?.value, album: this.form.get('album')?.value });
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
