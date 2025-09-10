import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs';

@Component({
  imports: [FormsModule, ReactiveFormsModule, MatToolbarModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  selector: 'app-list-toolbar',
  templateUrl: './list-toolbar.component.html',
  styleUrls: ['./list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbarComponent {
  creatingNew = input<boolean | null | undefined>(false);
  searching = input<boolean | null | undefined>(false);
  folder = input<string | null | undefined>('');

  readonly advancedSearch = output<void>();
  readonly searchRequest = output<SearchRequest>();
  readonly showPlayer = output<void>();
  readonly createNew = output<void>();
  readonly lyricsPriority = output<void>();

  protected folderControl = new FormControl<string | undefined>('', { nonNullable: true });

  form = new FormGroup({
    folder: this.folderControl,
  });

  constructor() {
    effect(() => {
      const folder = this.folder();

      if (folder && folder !== this.form.value) {
        this.folderControl.setValue(folder, { emitEvent: false });
      }
    });

    this.form.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((request: SearchRequest) => this.searchRequest.emit(request)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  onClear() {
    this.form.reset();
  }
}
