import { NgIf, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimePipe } from '@metal-p3/track/util';

@Component({
  standalone: true,
  imports: [NgIf, NgTemplateOutlet, MatToolbarModule, MatButtonModule, MatIconModule, TimePipe],
  selector: 'app-tracks-toolbar',
  templateUrl: './tracks-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracksToolbarComponent {
  @Input()
  gettingMaTracks = false;

  @Input()
  trackRenaming = false;

  @Input()
  enableMaActions = false;

  @Input()
  lyricsLoading = false;

  @Input()
  albumDuration = 0;

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
