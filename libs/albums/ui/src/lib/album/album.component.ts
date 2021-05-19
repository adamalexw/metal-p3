import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Album, AlbumWithoutTracks } from '@metal-p3/albums/data-access';
import { AlbumDto, MetalArchivesAlbumTrack, MetalArchivesUrl, Track } from '@metal-p3/api-interfaces';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-album',
  templateUrl: './album.component.html',
  styleUrls: ['./album.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumComponent implements OnChanges {
  @Input()
  album: Album | undefined;

  @Input()
  albumSaving = false;

  @Input()
  tracks: Track[] = [];

  @Input()
  tracksLoading = false;

  @Input()
  coverLoading = false;

  @Input()
  cover: string | undefined;

  @Input()
  findingUrl = false;

  @Input()
  maUrls: MetalArchivesUrl | undefined;

  @Input()
  gettingMaTracks = false;

  @Input()
  maTracks: MetalArchivesAlbumTrack[] = [];

  @Input()
  renamingTracks = false;

  @Input()
  gettingLyrics = false;

  @Output()
  readonly save = new EventEmitter<{ album: AlbumDto; tracks: Track[] }>();

  @Output()
  readonly coverUrl = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly findUrl = new EventEmitter<{ id: number; artist: string; album: string }>();

  @Output()
  readonly getMaTracks = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly lyrics = new EventEmitter<{ id: number; url: string }>();

  @Output()
  readonly openFolder = new EventEmitter<string>();

  @Output()
  readonly refreshTracks = new EventEmitter<{ id: number; folder: string }>();

  get albumUrl(): string {
    return this.form.get('albumUrl')?.value;
  }

  get artistUrl(): string {
    return this.form.get('artistUrl')?.value;
  }

  form: FormGroup;

  constructor(fb: FormBuilder, @Inject(WINDOW) readonly windowRef: Window) {
    this.form = fb.group({
      artist: [],
      album: [],
      year: [],
      genre: [],
      country: [],
      artistUrl: [],
      albumUrl: [],
      transferred: [],
      hasLyrics: [],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.album && this.album && !this.album.saving) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tracks, maTracks, ...rest } = this.album;

      this.patchForm(rest);
    }

    if (changes.maUrls && this.maUrls?.albumUrl) {
      this.setMaUrls(this.maUrls);
    }
  }

  private patchForm(album: AlbumWithoutTracks) {
    this.form.patchValue(album);
  }

  private setMaUrls(urls: MetalArchivesUrl) {
    this.form.get('artistUrl')?.setValue(urls.artistUrl);
    this.form.get('albumUrl')?.setValue(urls.albumUrl);
  }

  onSave(): void {
    const { folder, fullPath } = this.album as AlbumDto;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tracks, ...album } = this.form.getRawValue();

    let cover = '';
    if (this.cover) {
      cover = this.cover.replace('data:image/png;base64,', '');
    }

    this.save.emit({
      album: {
        ...album,
        id: this.album?.id,
        folder,
        fullPath,
        bandId: this.album?.bandId,
        cover,
      },
      tracks: this.form.get('tracks')?.value,
    });
  }

  private get albumId(): number {
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

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }
}
