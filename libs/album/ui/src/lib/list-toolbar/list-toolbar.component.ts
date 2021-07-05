import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchRequest } from '@metal-p3/album/domain';
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
  creatingNew = false;

  @Input()
  searching = false;

  @Input()
  criteria = '';

  @Output()
  readonly searchRequest = new EventEmitter<SearchRequest>();

  @Output()
  readonly createNew = new EventEmitter<void>();

  @Output()
  readonly lyricsPriority = new EventEmitter<void>();

  form: FormGroup;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      criteria: [],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.criteria && this.form && this.criteria !== this.form.get('criteria')?.value) {
      this.form.get('criteria')?.setValue(this.criteria);
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
}
