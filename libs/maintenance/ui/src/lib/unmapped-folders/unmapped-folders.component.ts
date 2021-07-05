import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-unmapped-folders',
  templateUrl: './unmapped-folders.component.html',
  styleUrls: ['./unmapped-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnmappedFoldersComponent {
  @Input()
  folders: string[] = [];

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
    this.folders = this.folders.filter((f) => f !== folder);
  }
}
