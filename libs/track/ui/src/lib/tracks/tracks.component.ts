import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
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
import { Observable, filter, map, take, tap } from 'rxjs';
import { LyricsComponent } from '../lyrics/lyrics.component';

@Component({
  imports: [
    AsyncPipe,
    BitRatePipe,
    ConfirmDeleteDirective,
    FormField,
    MatBottomSheetModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    TimePipe,
    TitleCaseDirective,
  ],
  selector: 'app-tracks',
  templateUrl: './tracks.component.html',
  styleUrls: ['./tracks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksComponent {
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly field = input.required<FieldTree<TracksForm[]>>();

  tracksLoading = input(false);
  tracks = input<Track[]>([]);
  tracksError = input<string | null | undefined>();

  transferTrack = output<number>();
  playTrack = output<Track>();
  addTrackToPlaylist = output<Track>();
  delete = output<Track>();

  displayedColumns$: Observable<string[]>;
  dataSource = new MatTableDataSource<FieldTree<TracksForm>>();

  constructor() {
    effect(() => {
      this.dataSource.data = [...this.field()];
    });

    this.displayedColumns$ = this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .pipe(map(({ matches }) => (matches ? ['trackNumber', 'title', 'duration', 'bitrate', 'actions'] : ['title', 'duration', 'actions'])));
  }

  viewLyrics(index: number, lyrics: string | undefined, syncedLyrics: string | undefined) {
    const synced = syncedLyrics?.trim();
    const data = synced ? { text: synced, source: 'synced' as const } : { text: lyrics ?? '', source: 'plain' as const };

    const ref = this.bottomSheet.open(LyricsComponent, { data });

    if (data.source === 'synced') return;

    ref
      .afterDismissed()
      .pipe(
        take(1),
        filter((newLyrics) => newLyrics !== undefined),
        tap((newLyrics) =>
          this.field()
            [index].lyrics()
            .value.set(newLyrics ?? ''),
        ),
      )
      .subscribe();
  }

  onPlayTrack(id: number) {
    const track = this.getTrack(id);

    if (track) {
      this.playTrack.emit(track);
    }
  }

  onAddTrackToPlaylist(id: number) {
    const track = this.getTrack(id);

    if (track) {
      this.addTrackToPlaylist.emit(track);
    }
  }

  onDelete(result: boolean, id: number) {
    if (result) {
      const track = this.getTrack(id);

      if (track) {
        this.delete.emit(track);
      }
    }
  }

  trackByFn(index: number, item: FieldTree<TracksForm>) {
    return item().value().id || index;
  }

  private getTrack(id: number): Track | undefined {
    return this.tracks()?.find((t) => t.id === id);
  }
}
