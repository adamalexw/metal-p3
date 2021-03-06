import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-album-toolbar',
  templateUrl: './album-toolbar.component.html',
  styleUrls: ['./album-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumToolbarComponent {
  @Input()
  saving: boolean | null = false;

  @Input()
  findingUrl: boolean | null = false;

  @Input()
  renamingFolder: boolean | null = false;

  @Input()
  trackTransferring: boolean | null = false;

  @Input()
  folder = '';

  @Input()
  extraFiles: boolean | undefined;

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
