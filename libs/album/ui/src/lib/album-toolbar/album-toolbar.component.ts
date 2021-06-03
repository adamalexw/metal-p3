import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CloseFunctionality } from '@metal-p3/album/domain';

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
  renamingFolder = false;

  @Input()
  gettingLyrics = false;

  @Input()
  folder = '';

  @Input()
  closeFunctionality: CloseFunctionality = 'close';

  @Output()
  readonly save = new EventEmitter<void>();

  @Output()
  readonly imageSearch = new EventEmitter<void>();

  @Output()
  readonly findUrl = new EventEmitter<void>();

  @Output()
  readonly renameTracks = new EventEmitter<void>();

  @Output()
  readonly renameFolder = new EventEmitter<void>();

  @Output()
  readonly maTracks = new EventEmitter<void>();

  @Output()
  readonly lyrics = new EventEmitter<void>();

  @Output()
  readonly openFolder = new EventEmitter<void>();

  @Output()
  readonly refreshTracks = new EventEmitter<void>();

  @Output()
  readonly closeAlbum = new EventEmitter<void>();
}
