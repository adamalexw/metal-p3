import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Track } from '@metal-p3/api-interfaces';

@Component({
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksComponent implements OnChanges {
  @Input()
  form: FormGroup | undefined;

  @Input()
  tracksLoading = false;

  @Input()
  tracks: Track[] = [];

  displayedColumns = ['trackNumber', 'title', 'duration', 'bitrate', 'lyrics', 'trackSaving'];
  dataSource: MatTableDataSource<AbstractControl> = new MatTableDataSource();

  private tracksArray: FormArray = new FormArray([]);

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form && changes.tracks && this.tracks?.length) {
      if (!this.form.get('tracks')) {
        this.form.addControl('tracks', this.tracksArray);
        this.addTracks(this.tracks);
      } else {
        this.tracksArray?.patchValue(this.tracks);
      }
    }
  }

  private addTracks(tracks: Track[]) {
    this.tracksArray.clear();

    for (let index = 0; index < tracks.length; index++) {
      this.tracksArray.push(this.addTrack(tracks[index]));
    }

    this.dataSource = new MatTableDataSource(this.tracksArray.controls);
  }

  private addTrack(track: Track): FormGroup {
    return this.fb.group({
      id: [track.id],
      trackNumber: [track.trackNumber],
      title: [track.title],
      duration: [track.duration?.toString()],
      bitrate: [track.bitrate?.toString()],
      lyrics: [track.lyrics],
      folder: [track.folder],
      fullPath: [track.fullPath],
      trackSaving: [track.trackSaving],
    });
  }

  viewLyrics(lyrics: string) {}
}
