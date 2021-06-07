import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
export class ListToolbarComponent implements OnInit {
  @Input()
  creatingNew = false;

  @Output()
  readonly searchRequest = new EventEmitter<SearchRequest>();

  @Output()
  readonly createNew = new EventEmitter<void>();

  @Output()
  readonly viewPlayer = new EventEmitter<void>();

  form: FormGroup;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      take: ['10'],
      criteria: [],
    });
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
