import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { SearchRequest } from '@metal-p3/api-interfaces';

@Component({
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatInputModule, MatButtonModule],
  selector: 'app-advanced-search-form',
  templateUrl: './advanced-search-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchFormComponent implements OnChanges {
  @Input()
  request: SearchRequest | null | undefined;

  @Output()
  searchRequest = new EventEmitter<SearchRequest>();

  form = this.fb.group(
    {
      folder: [undefined as string | undefined],
      artist: [undefined as string | undefined],
      album: [undefined as string | undefined],
      year: [undefined as number | undefined],
      genre: [undefined as string | undefined],
      country: [undefined as string | undefined],
      transferred: [undefined as boolean | undefined],
      hasLyrics: [undefined as boolean | undefined],
    },
    { updateOn: 'submit' }
  );

  constructor(private readonly fb: NonNullableFormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.request && this.request) {
      const { skip: _skip, take: _take, cancel: _cancel, ...value } = this.request;
      this.form.patchValue(value);
    }
  }
}
