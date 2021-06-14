import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ApplyLyrics } from '@metal-p3/album/domain';
import { MetalArchivesAlbumTrack, Track } from '@metal-p3/api-interfaces';

@Component({
  selector: 'app-lyrics',
  templateUrl: './lyrics.component.html',
  styleUrls: ['./lyrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LyricsComponent implements OnChanges {
  @Input()
  albumId!: number;

  @Input()
  tracks: Track[] = [];

  @Input()
  tracksLoading = false;

  @Input()
  maTracks: MetalArchivesAlbumTrack[] = [];

  @Input()
  maTracksLoading = false;

  @Input()
  lyricsLoadingProgress = 0;

  @Input()
  applyingProgress = 0;

  @Input()
  applying = false;

  @Output()
  applyLyrics = new EventEmitter<{ id: number; lyrics: ApplyLyrics[] }>();

  displayedColumns = ['trackNumber', 'title', 'duration', 'maTrack'];
  dataSource: ApplyLyrics[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.tracks || changes.maTracks) {
      this.mapDataSource(this.tracks, this.maTracks);
    }
  }

  private mapDataSource(tracks: Track[], maTracks: MetalArchivesAlbumTrack[]) {
    if (tracks?.length && maTracks?.length) {
      this.dataSource = tracks.map((track) => this.mapApplyLyrics(track, maTracks));
    }
  }

  private mapApplyLyrics(track: Track, maTracks: MetalArchivesAlbumTrack[]): ApplyLyrics {
    let maTrack = maTracks.find((item) => item.title?.toLowerCase() === track.title?.toLowerCase());

    if (maTrack) {
      return { ...track, maTrack };
    }

    maTrack = maTracks.find((item) => Number(item.trackNumber) === Number(track.trackNumber));

    if (maTrack) {
      return { ...track, maTrack };
    }

    return { ...track, maTrack: maTracks[0] };
  }

  onApply() {
    this.applyLyrics.emit({ id: this.albumId, lyrics: this.dataSource });
  }
}
