import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-album-toolbar',
  templateUrl: './album-toolbar.component.html',
  styleUrls: ['./album-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumToolbarComponent {
  @Input()
  saving = false;

  @Input()
  findingUrl = false;

  @Input()
  gettingMaTracks = false;

  @Input()
  renamingTracks = false;

  @Input()
  gettingLyrics = false;

  @Output()
  save = new EventEmitter<void>();

  @Output()
  imageSearch = new EventEmitter<void>();

  @Output()
  findUrl = new EventEmitter<void>();

  @Output()
  renameTracks = new EventEmitter<void>();

  @Output()
  maTracks = new EventEmitter<void>();

  @Output()
  lyrics = new EventEmitter<void>();

  @Output()
  openFolder = new EventEmitter<void>();

  @Output()
  refreshTracks = new EventEmitter<void>();
}
