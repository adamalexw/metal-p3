import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-album-header',
  templateUrl: './album-header.component.html',
  styleUrls: ['./album-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumHeaderComponent {
  @Input()
  folder: string | undefined;

  @Output()
  readonly closeAlbum = new EventEmitter<void>();
}
