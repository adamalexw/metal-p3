import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ConfirmDeleteDirective } from '@metal-p3/shared/feedback';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  standalone: true,
  imports: [NgIf, NgFor, NavToolbarComponent, ConfirmDeleteDirective, MatIconModule, MatListModule],
  selector: 'app-unmapped-folders',
  templateUrl: './unmapped-folders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnmappedFoldersComponent {
  @Input()
  folders: string[] | null | undefined = [];

  @Output()
  readonly openFolder = new EventEmitter<string>();

  @Output()
  readonly add = new EventEmitter<string>();

  @Output()
  readonly search = new EventEmitter<string>();

  @Output()
  readonly delete = new EventEmitter<string>();

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
    this.folders = this.folders?.filter((f) => f !== folder);
  }
}
