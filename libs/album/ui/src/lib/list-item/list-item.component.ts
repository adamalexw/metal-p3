import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CoverComponent } from '@metal-p3/cover/ui';
import { Album } from '@metal-p3/shared/data-access';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';

@Component({
  imports: [ConfirmDeleteDirective, CoverComponent, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent {
  album = input.required<Album>();

  readonly openAlbum = output<number>();
  readonly deleteAlbum = output<void>();
  readonly transferAlbum = output<void>();
  readonly playAlbum = output<void>();
  readonly addToPlaylist = output<void>();

  onDelete(result: boolean) {
    if (result) {
      this.deleteAlbum.emit();
    }
  }
}
