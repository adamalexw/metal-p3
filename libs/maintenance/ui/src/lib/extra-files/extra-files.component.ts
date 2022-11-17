import { NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  standalone: true,
  imports: [NgFor, MatListModule, MatIconModule],
  selector: 'app-extra-files',
  templateUrl: './extra-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesComponent {
  @Input()
  folders: string[] | null = [];

  @Output()
  readonly openFolder = new EventEmitter<string>();
}
