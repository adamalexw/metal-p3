import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, effect, inject, input } from '@angular/core';
import { ControlContainer, FormArray, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { TitleCaseDirective } from '@metal-p3/shared/title-case';
import { Track, TracksForm } from '@metal-p3/track/domain';
import { BitRatePipe, TimePipe } from '@metal-p3/track/util';
import { Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { LyricsComponent } from '../lyrics/lyrics.component';

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    BitRatePipe,
    ConfirmDeleteDirective,
    FormsModule,
    LyricsComponent,
    MatBottomSheetModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TimePipe,
    TitleCaseDirective,
  ],
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksComponent implements OnInit {
  private readonly controlContainer = inject(ControlContainer);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected form!: FormArray<FormGroup<TracksForm>>;

  tracksLoading = input(false);
  tracks = input<Track[]>([]);
  tracksError = input<string | null | undefined>();

  @Output()
  transferTrack = new EventEmitter<number>();

  @Output()
  playTrack = new EventEmitter<Track>();

  @Output()
  addTrackToPlaylist = new EventEmitter<Track>();

  @Output()
  delete = new EventEmitter<Track>();

  displayedColumns$: Observable<string[]>;
  dataSource = new MatTableDataSource<FormGroup<TracksForm>>();

  constructor() {
    effect(() => {
      const tracks = this.tracks();

      if (tracks?.length) {
        this.addTracks(tracks);
      }
    });

    this.displayedColumns$ = this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .pipe(map(({ matches }) => (matches ? ['trackNumber', 'title', 'duration', 'bitrate', 'actions'] : ['title', 'duration', 'actions'])));
  }

  ngOnInit(): void {
    this.form = this.controlContainer.control?.get('tracks') as FormArray<FormGroup<TracksForm>>;
  }

  private addTracks(tracks: Track[]) {
    this.form.clear();

    for (let index = 0; index < tracks.length; index++) {
      this.form.push(this.addTrack(tracks[index]));
    }

    this.dataSource.data = this.form.controls;
  }

  private addTrack(track: Track): FormGroup<TracksForm> {
    return this.fb.group({
      id: this.fb.control(track.id),
      trackNumber: this.fb.control(track.trackNumber),
      title: this.fb.control(track.title),
      duration: this.fb.control(track.duration),
      bitrate: this.fb.control(track.bitrate),
      lyrics: this.fb.control(track.lyrics),
      file: this.fb.control(track.file),
      folder: this.fb.control(track.folder),
      fullPath: this.fb.control(track.fullPath),
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
        tap((newLyrics) => this.form.at(index).controls.lyrics.setValue(newLyrics)),
      )
      .subscribe();
  }

  onPlayTrack(id: number) {
    this.playTrack.emit(this.tracks().find((t) => t.id === id));
  }

  onAddTrackToPlaylist(id: number) {
    this.addTrackToPlaylist.emit(this.tracks().find((t) => t.id === id));
  }

  onDelete(result: boolean, id: number) {
    if (result) {
      this.delete.emit(this.tracks().find((t) => t.id === id));
    }
  }

  trackByFn(index: number, item: FormGroup<TracksForm>) {
    return item.controls.id.value || index;
  }
}
