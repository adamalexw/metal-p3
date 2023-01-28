import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-album-header',
  templateUrl: './album-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumHeaderComponent {
  @Input()
  folder: string | undefined;
}
