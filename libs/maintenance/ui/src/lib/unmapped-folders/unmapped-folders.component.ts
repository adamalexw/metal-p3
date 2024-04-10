import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  standalone: true,
  imports: [NavToolbarComponent, ConfirmDeleteDirective, MatIconModule, MatListModule],
  selector: 'app-unmapped-folders',
  templateUrl: './unmapped-folders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnmappedFoldersComponent {
  folders = model<string[]>([]);

  readonly openFolder = output<string>();
  readonly add = output<string>();
  readonly search = output<string>();
  readonly delete = output<string>();

  onAdd(folder: string) {
    this.add.emit(folder);
    this.updateFolders(folder);
  }

  onDelete(result: boolean, folder: string) {
    if (result) {
      this.delete.emit(folder);
      this.updateFolders(folder);
    }
  }

  private updateFolders(folder: string) {
    this.folders.update((folders) => folders.filter((f) => f !== folder) || null);
  }
}
