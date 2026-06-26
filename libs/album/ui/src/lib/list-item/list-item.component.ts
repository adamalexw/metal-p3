import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CoverComponent } from '@metal-p3/cover/ui';
import { Album } from '@metal-p3/album/domain';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { CountryFlagPipe } from '@metal-p3/shared/utils';

@Component({
  imports: [ConfirmDeleteDirective, CoverComponent, CountryFlagPipe, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styles: [
    `
      p {
        font-family: 'Pirata One', sans-serif;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent {
  readonly album = input.required<Album>();
  readonly coverLoading = input(false);
  readonly coverError = input<string | undefined>(undefined);
  readonly cover = input<string | undefined>(undefined);

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
