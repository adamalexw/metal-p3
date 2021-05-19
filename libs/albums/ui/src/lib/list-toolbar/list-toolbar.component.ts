import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchRequest } from '@metal-p3/albums/domain';
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
  @Output()
  searchRequest = new EventEmitter<SearchRequest>();

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
        tap(console.log),
        tap((request: SearchRequest) => this.searchRequest.emit(request))
      )
      .subscribe();
  }
}
