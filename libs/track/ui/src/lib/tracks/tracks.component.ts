import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatTableDataSource } from '@angular/material/table';
import { Track } from '@metal-p3/api-interfaces';
import { filter, take, tap } from 'rxjs/operators';
import { LyricsComponent } from '../lyrics/lyrics.component';

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

  @Output()
  transferTrack = new EventEmitter<number>();

  @Output()
  playTrack = new EventEmitter<Track>();

  @Output()
  addTrackToPlaylist = new EventEmitter<Track>();

  @Output()
  delete = new EventEmitter<Track>();

  displayedColumns = ['trackNumber', 'title', 'duration', 'bitrate', 'lyrics'];
  dataSource: MatTableDataSource<AbstractControl> = new MatTableDataSource();

  private tracksArray: FormArray = new FormArray([]);

  constructor(private fb: FormBuilder, private bottomSheet: MatBottomSheet) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form && changes.tracks && this.tracks?.length) {
      if (!this.form.get('tracks')) {
        this.form.addControl('tracks', this.tracksArray);
      }

      this.addTracks(this.tracks);
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
      duration: [track.duration],
      bitrate: [track.bitrate],
      lyrics: [track.lyrics],
      folder: [track.folder],
      fullPath: [track.fullPath],
    });
  }

  viewLyrics(index: number, lyrics: string) {
    const ref = this.bottomSheet.open(LyricsComponent, {
      data: { lyrics },
      panelClass: ['h-screen', 'pr-0'],
    });

    ref
      .afterDismissed()
      .pipe(
        take(1),
        filter((newLyrics) => newLyrics !== undefined),
        tap((newLyrics) => this.tracksArray.at(index)?.get('lyrics')?.setValue(newLyrics))
      )
      .subscribe();
  }

  onPlayTrack(id: number) {
    this.playTrack.emit(this.tracks.find((t) => t.id === id));
  }

  onAddTrackToPlaylist(id: number) {
    this.addTrackToPlaylist.emit(this.tracks.find((t) => t.id === id));
  }

  onDelete(result: boolean, id: number) {
    if (result) {
      this.delete.emit(this.tracks.find((t) => t.id === id));
    }
  }

  trackByFn(index: number, item: FormGroup) {
    return item.get('id')?.value || index;
  }
}
