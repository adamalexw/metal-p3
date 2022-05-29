import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchRequest } from '@metal-p3/api-interfaces';

@Component({
  selector: 'app-advanced-search-form',
  templateUrl: './advanced-search-form.component.html',
  styleUrls: ['./advanced-search-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchFormComponent implements OnChanges {
  @Input()
  request: SearchRequest | null | undefined;

  @Output()
  searchRequest = new EventEmitter<SearchRequest>();

  form: FormGroup;

  constructor(fb: FormBuilder) {
    this.form = fb.group({
      folder: [],
      artist: [],
      album: [],
      year: [],
      genre: [],
      country: [],
      transferred: [],
      hasLyrics: [],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.request && this.request) {
      const { skip: _skip, take: _take, ...value } = this.request;
      this.form.patchValue(value);
    }
  }
}
