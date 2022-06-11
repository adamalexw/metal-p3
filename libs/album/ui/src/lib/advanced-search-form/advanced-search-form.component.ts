import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NonNullableFormBuilder } from '@angular/forms';
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

  form = this.fb.group({
    folder: [undefined as string | undefined],
    artist: [undefined as string | undefined],
    album: [undefined as string | undefined],
    year: [undefined as number | undefined],
    genre: [undefined as string | undefined],
    country: [undefined as string | undefined],
    transferred: [undefined as boolean | undefined],
    hasLyrics: [undefined as boolean | undefined],
  });

  constructor(private readonly fb: NonNullableFormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.request && this.request) {
      const { skip: _skip, take: _take, cancel: _cancel, ...value } = this.request;
      this.form.patchValue(value);
    }
  }
}
