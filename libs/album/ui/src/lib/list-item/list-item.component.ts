import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Album } from '@metal-p3/shared/data-access';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent {
  @Input()
  album: Album | undefined;

  @Input()
  trackTransferringProgress = 0;

  @Output()
  readonly openAlbum = new EventEmitter<number>();

  @Output()
  readonly renameFolder = new EventEmitter<void>();

  @Output()
  readonly transferAlbum = new EventEmitter<void>();

  @Output()
  readonly playAlbum = new EventEmitter<void>();

  @Output()
  readonly addToPlaylist = new EventEmitter<void>();
}
