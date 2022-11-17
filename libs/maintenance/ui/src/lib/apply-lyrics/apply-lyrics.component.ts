import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { MetalArchivesAlbumTrack } from '@metal-p3/api-interfaces';
import { Track } from '@metal-p3/track/domain';
import { ApplyLyricsToolbarComponent } from '../apply-lyrics-toolbar/apply-lyrics-toolbar.component';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, ApplyLyricsToolbarComponent, MatProgressBarModule, MatTableModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule],
  selector: 'app-apply-lyrics',
  templateUrl: './apply-lyrics.component.html',
  styleUrls: ['./apply-lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLyricsComponent implements OnChanges {
  @Input()
  albumId!: number;

  @Input()
  tracks: Track[] | null | undefined = [];

  @Input()
  tracksLoading: boolean | null = true;

  @Input()
  maTracks: MetalArchivesAlbumTrack[] | null | undefined = [];

  @Input()
  maTracksLoading: boolean | null = true;

  @Input()
  lyricsLoadingProgress: number | null = 0;

  @Input()
  applyingProgress: number | null = 0;

  @Input()
  applying: boolean | null = false;

  @Input()
  trackTransferring: boolean | null = false;

  @Input()
  trackTransferringProgress: number | null = 0;

  @Input()
  albumUrl: string | null | undefined;

  @Input()
  coverLoading: boolean | null = false;

  @Input()
  cover: string | null | undefined;

  @Input()
  folder: string | null | undefined;

  @Input()
  showClose = true;

  @Output()
  readonly applyLyrics = new EventEmitter<{ id: number; lyrics: ApplyLyrics[] }>();

  @Output()
  readonly transfer = new EventEmitter<{ id: number; trackId: number }[]>();

  @Output()
  readonly done = new EventEmitter<void>();

  displayedColumns = ['trackNumber', 'title', 'duration', 'maTrack', 'selected'];
  dataSource: ApplyLyrics[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.tracks || changes.maTracks) && !this.applyingProgress && !this.trackTransferring) {
      this.mapDataSource(this.tracks || [], this.maTracks || []);
    }
  }

  trackByFn(_index: number, item: ApplyLyrics) {
    return item.id;
  }

  private mapDataSource(tracks: Track[], maTracks: MetalArchivesAlbumTrack[]) {
    if (tracks?.length && maTracks?.length) {
      this.dataSource = tracks.map((track) => this.mapApplyLyrics(track, maTracks));
    }
  }

  private mapApplyLyrics(track: Track, maTracks: MetalArchivesAlbumTrack[]): ApplyLyrics {
    let maTrack = maTracks.find((item) => item.title?.toLowerCase() === track.title?.toLowerCase());

    if (maTrack) {
      return { ...track, maTrack, selected: true };
    }

    maTrack = maTracks.find((item) => Number(item.trackNumber) === Number(track.trackNumber));

    if (maTrack) {
      return { ...track, maTrack };
    }

    return { ...track, maTrack: maTracks[0] };
  }

  onApply() {
    this.applyLyrics.emit({ id: this.albumId, lyrics: this.dataSource.filter((l) => l.selected) });
  }

  onSelectAll(checked: boolean) {
    this.dataSource.forEach((lh) => (lh.selected = checked));
  }

  onSelectItem(id: number, checked: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.dataSource.find((i) => i.id === id)!.selected = checked;
  }

  onTransfer() {
    this.transfer.emit(this.dataSource.filter((l) => l.selected).map((l) => ({ id: this.albumId, trackId: l.id })));
  }
}
