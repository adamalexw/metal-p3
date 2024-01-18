import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CoverComponent } from '@metal-p3/cover/ui';
import { Album } from '@metal-p3/shared/data-access';

@Component({
  standalone: true,
  imports: [CoverComponent, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
