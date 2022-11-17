import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-album-header',
  templateUrl: './album-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumHeaderComponent {
  @Input()
  folder: string | undefined;

  @Output()
  readonly closeAlbum = new EventEmitter<void>();
}
