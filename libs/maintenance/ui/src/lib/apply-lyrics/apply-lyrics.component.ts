/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
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
  imports: [DatePipe, ApplyLyricsToolbarComponent, MatProgressBarModule, MatTableModule, MatFormFieldModule, MatSelectModule, MatCheckboxModule],
  selector: 'app-apply-lyrics',
  templateUrl: './apply-lyrics.component.html',
  styleUrls: ['./apply-lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplyLyricsComponent {
  albumId = input.required<number | null>();
  tracks = input<Track[] | null | undefined>([]);
  tracksLoading = input<boolean | null>(true);
  maTracks = input<MetalArchivesAlbumTrack[] | null | undefined>([]);
  maTracksLoading = input<boolean | null>(true);
  lyricsLoadingProgress = input<number | null>(0);
  applyingProgress = input<number | null>(0);
  applying = input<boolean | null>(false);
  trackTransferring = input<boolean | null>(false);
  trackTransferringProgress = input<number | null>(0);
  albumUrl = input<string | null | undefined>();
  coverLoading = input<boolean | null>(false);
  cover = input<string | null | undefined>();
  folder = input<string | null | undefined>();
  showClose = input(true);

  readonly applyLyrics = output<{
    id: number;
    lyrics: ApplyLyrics[];
  }>();

  readonly transfer = output<
    {
      id: number;
      trackId: number;
    }[]
  >();

  readonly done = output<void>();

  displayedColumns = ['trackNumber', 'title', 'duration', 'maTrack', 'selected'];
  dataSource: ApplyLyrics[] = [];

  constructor() {
    effect(() => {
      const tracks = this.tracks();
      const maTracks = this.maTracks();

      if (tracks?.length && maTracks?.length) {
        this.mapDataSource(tracks, maTracks);
      }
    });
  }

  trackByFn(_index: number, item: ApplyLyrics) {
    return item.id;
  }

  private mapDataSource(tracks: Track[], maTracks: MetalArchivesAlbumTrack[]) {
    if (tracks && maTracks) {
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
    this.applyLyrics.emit({ id: this.albumId()!, lyrics: this.dataSource.filter((l) => l.selected) });
  }

  onSelectAll(checked: boolean) {
    this.dataSource.forEach((lh) => (lh.selected = checked));
  }

  onSelectItem(id: number, checked: boolean) {
    this.dataSource.find((i) => i.id === id)!.selected = checked;
  }

  onTransfer() {
    this.transfer.emit(this.dataSource.filter((l) => l.selected).map((l) => ({ id: this.albumId()!, trackId: l.id })));
  }
}
