import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';
import { AlbumHeaderComponent } from '../album-header/album-header.component';

@Component({
  imports: [NavToolbarComponent, AlbumHeaderComponent, ConfirmDeleteDirective, MatIconModule, MatButtonModule, MatToolbarModule, MatBadgeModule],
  selector: 'app-album-toolbar',
  templateUrl: './album-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumToolbarComponent {
  readonly saving = input(false);
  readonly findingUrl = input(false);
  readonly renamingFolder = input(false);
  readonly trackTransferring = input(false);
  readonly folder = input('');
  readonly extraFiles = input<boolean | undefined>();

  readonly save = output<void>();
  readonly imageSearch = output<void>();
  readonly findUrl = output<void>();
  readonly renameFolder = output<void>();
  readonly openFolder = output<void>();
  readonly transfer = output<void>();
  readonly refresh = output<void>();
  readonly delete = output<void>();

  onDelete(result: boolean) {
    if (result) {
      this.delete.emit();
    }
  }
}
