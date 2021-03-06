import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-list-toolbar',
  templateUrl: './list-toolbar.component.html',
  styleUrls: ['./list-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbarComponent implements OnInit, OnChanges {
  @Input()
  creatingNew: boolean | null | undefined = false;

  @Input()
  searching: boolean | null | undefined = false;

  @Input()
  folder: string | null | undefined = '';

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.folder && this.form && this.folder !== this.form.value.folder) {
      this.folderControl.setValue(this.folder ?? '', { emitEvent: false });
    }
  }

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        distinctUntilChanged(),
        tap((request: SearchRequest) => this.searchRequest.emit(request))
      )
      .subscribe();
  }

  onClear() {
    this.form.reset();
  }
}
