import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { Track, tracksFormArray } from '@metal-p3/track/domain';
import { BitRatePipe, TimePipe } from '@metal-p3/track/util';
import { filter, take, tap } from 'rxjs/operators';
import { LyricsComponent } from '../lyrics/lyrics.component';

@Component({
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    BitRatePipe,
    TimePipe,
    LyricsComponent,
    ConfirmDeleteDirective,
    MatProgressSpinnerModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBottomSheetModule,
  ],
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksComponent implements OnChanges {
  @Input()
  form!: FormGroup;

  @Input()
  tracksLoading = false;

  @Input()
  tracks: Track[] = [];

  @Input()
  tracksError: string | null | undefined;

  @Output()
  transferTrack = new EventEmitter<number>();

  @Output()
  playTrack = new EventEmitter<Track>();

  @Output()
  addTrackToPlaylist = new EventEmitter<Track>();

  @Output()
  delete = new EventEmitter<Track>();

  displayedColumns = ['trackNumber', 'title', 'duration', 'bitrate', 'lyrics'];
  dataSource: MatTableDataSource<typeof tracksFormArray> = new MatTableDataSource();

  private get tracksArray(): FormArray<typeof tracksFormArray> {
    return this.form.get('tracks') as FormArray<typeof tracksFormArray>;
  }

  constructor(private fb: NonNullableFormBuilder, private bottomSheet: MatBottomSheet) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.form && changes.tracks && this.tracks?.length) {
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

  private addTrack(track: Track): typeof tracksFormArray {
    return new FormGroup({
      id: new FormControl<number>(track.id, { nonNullable: true }),
      trackNumber: new FormControl<string>(track.trackNumber, { nonNullable: true }),
      title: new FormControl<string>(track.title, { nonNullable: true }),
      duration: new FormControl<number | undefined>(track.duration, { nonNullable: true }),
      bitrate: new FormControl<number | undefined>(track.bitrate, { nonNullable: true }),
      lyrics: new FormControl<string | undefined>(track.lyrics, { nonNullable: true }),
      file: new FormControl<string>(track.file, { nonNullable: true }),
      folder: new FormControl<string>(track.folder, { nonNullable: true }),
      fullPath: new FormControl<string>(track.fullPath, { nonNullable: true }),
    });
  }

  viewLyrics(index: number, lyrics: string) {
    const ref = this.bottomSheet.open(LyricsComponent, {
      data: { lyrics },
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

  trackByFn(index: number, item: AbstractControl) {
    return item.get('id')?.value || index;
  }
}
