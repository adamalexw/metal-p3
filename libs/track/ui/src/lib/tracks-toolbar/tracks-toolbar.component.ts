import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tracks-toolbar',
  templateUrl: './tracks-toolbar.component.html',
  styleUrls: ['./tracks-toolbar.component.scss'],
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
