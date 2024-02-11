import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';
import { AlbumHeaderComponent } from '../album-header/album-header.component';

@Component({
  standalone: true,
  imports: [NavToolbarComponent, AlbumHeaderComponent, ConfirmDeleteDirective, MatIconModule, MatButtonModule, MatToolbarModule, MatBadgeModule],
  selector: 'app-album-toolbar',
  templateUrl: './album-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumToolbarComponent {
  saving = input<boolean | null>(false);
  findingUrl = input<boolean | null>(false);
  renamingFolder = input<boolean | null>(false);
  trackTransferring = input<boolean | null>(false);
  folder = input('');
  extraFiles = input<boolean | undefined>();

  @Output()
  readonly save = new EventEmitter<void>();

  @Output()
  readonly imageSearch = new EventEmitter<void>();

  @Output()
  readonly findUrl = new EventEmitter<void>();

  @Output()
  readonly renameFolder = new EventEmitter<void>();

  @Output()
  readonly openFolder = new EventEmitter<void>();

  @Output()
  readonly transfer = new EventEmitter<void>();

  @Output()
  readonly delete = new EventEmitter<void>();

  onDelete(result: boolean) {
    if (result) {
      this.delete.emit();
    }
  }
}
