import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-album-header',
  templateUrl: './album-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumHeaderComponent {
  folder = input.required<string>();
}
