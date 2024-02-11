import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimePipe } from '@metal-p3/track/util';

@Component({
  standalone: true,
  imports: [NgTemplateOutlet, MatToolbarModule, MatButtonModule, MatIconModule, TimePipe],
  selector: 'app-tracks-toolbar',
  templateUrl: './tracks-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksToolbarComponent {
  gettingMaTracks = input(false);
  trackRenaming = input(false);
  enableMaActions = input(false);
  lyricsLoading = input(false);
  albumDuration = input(0);

  @Output()
  readonly trackNumbers = new EventEmitter<void>();

  @Output()
  readonly renameTracks = new EventEmitter<void>();

  @Output()
  readonly maTracks = new EventEmitter<void>();

  @Output()
  readonly lyrics = new EventEmitter<void>();

  @Output()
  readonly refreshTracks = new EventEmitter<void>();

  @Output()
  readonly playAlbum = new EventEmitter<void>();

  @Output()
  readonly addAlbumToPlaylist = new EventEmitter<void>();
}
