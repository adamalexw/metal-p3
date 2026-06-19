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
  readonly albumId = input.required<number>();
  readonly tracks = input<Track[]>([]);
  readonly tracksLoading = input(false);
  readonly maTracks = input<MetalArchivesAlbumTrack[]>([]);
  readonly maTracksLoading = input(false);
  readonly lyricsLoading = input(false);
  readonly lyricsExpected = input(false);
  readonly lyricsLoadingProgress = input(0);
  readonly applyingProgress = input(0);
  readonly applying = input(false);
  readonly applied = input(false);
  readonly trackTransferring = input(false);
  readonly trackTransferringProgress = input(0);
  readonly albumUrl = input<string>();
  readonly coverLoading = input(false);
  readonly cover = input<string>();
  readonly folder = input<string>();
  readonly showClose = input(true);

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

  private manualSelections = new Map<number, boolean>();
  private manualMaTracks = new Map<number, MetalArchivesAlbumTrack>();

  constructor() {
    effect(() => {
      const tracks = this.tracks();
      const maTracks = this.maTracks();

      if (tracks?.length) {
        this.mapDataSource(tracks, maTracks ?? []);
      }
    });
  }

  trackByFn(_index: number, item: ApplyLyrics) {
    return item.id;
  }

  private mapDataSource(tracks: Track[], maTracks: MetalArchivesAlbumTrack[]) {
    this.dataSource = tracks.map((track) => {
      const mapped = this.mapApplyLyrics(track, maTracks);
      if (this.manualSelections.has(track.id)) {
        mapped.selected = this.manualSelections.get(track.id)!;
      }
      if (this.manualMaTracks.has(track.id)) {
        mapped.maTrack = this.manualMaTracks.get(track.id)!;
      }
      return mapped;
    });
  }

  private mapApplyLyrics(track: Track, maTracks: MetalArchivesAlbumTrack[]): ApplyLyrics {
    const lyricsSource = track.lyricsSource ?? (track.syncedLyrics ? 'synced' : null);

    // No metal-archives tracklist (album without an MA url): lyrics come straight from LrcLib on the local track.
    if (!maTracks.length) {
      return { ...track, lyricsSource, selected: !!track.syncedLyrics || (lyricsSource === 'plain' && !!track.lyrics) };
    }

    let maTrack = maTracks.find((item) => item.title?.toLowerCase() === track.title?.toLowerCase());

    if (maTrack) {
      return { ...track, maTrack, lyricsSource, selected: true };
    }

    maTrack = maTracks.find((item) => Number(item.trackNumber) === Number(track.trackNumber));

    if (maTrack) {
      return { ...track, maTrack, lyricsSource, selected: !!track.syncedLyrics };
    }

    return { ...track, maTrack: maTracks[0], lyricsSource, selected: !!track.syncedLyrics };
  }

  onApply() {
    this.applyLyrics.emit({ id: this.albumId()!, lyrics: this.dataSource.filter((l) => l.selected) });
  }

  onSelectAll(checked: boolean) {
    this.dataSource.forEach((lh) => {
      lh.selected = checked;
      this.manualSelections.set(lh.id, checked);
    });
  }

  onSelectItem(id: number, checked: boolean) {
    this.dataSource.find((i) => i.id === id)!.selected = checked;
    this.manualSelections.set(id, checked);
  }

  onSelectMaTrack(id: number, maTrack: MetalArchivesAlbumTrack) {
    this.dataSource.find((i) => i.id === id)!.maTrack = maTrack;
    this.manualMaTracks.set(id, maTrack);
  }
  
  onTransfer() {
    this.transfer.emit(this.dataSource.filter((l) => l.selected).map((l) => ({ id: this.albumId()!, trackId: l.id })));
  }
}
