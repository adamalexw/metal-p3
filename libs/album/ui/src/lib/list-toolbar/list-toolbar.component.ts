import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output, effect, input } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatToolbarModule, RouterModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, MatProgressBarModule],
  selector: 'app-list-toolbar',
  templateUrl: './list-toolbar.component.html',
  styleUrls: ['./list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbarComponent implements OnInit {
  creatingNew = input<boolean | null | undefined>(false);
  searching = input<boolean | null | undefined>(false);
  folder = input<string | null | undefined>('');

  @Output()
  readonly advancedSearch = new EventEmitter<void>();

  @Output()
  readonly searchRequest = new EventEmitter<SearchRequest>();

  @Output()
  readonly showPlayer = new EventEmitter<void>();

  @Output()
  readonly createNew = new EventEmitter<void>();

  @Output()
  readonly lyricsPriority = new EventEmitter<void>();

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
  }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        distinctUntilChanged(),
        tap((request: SearchRequest) => this.searchRequest.emit(request)),
      )
      .subscribe();
  }

  onClear() {
    this.form.reset();
  }
}
