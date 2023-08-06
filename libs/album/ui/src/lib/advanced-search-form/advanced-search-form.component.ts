import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { TAKE } from '@metal-p3/album/domain';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { objectKeys } from '@metal-p3/shared/utils';

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

  form = this.createForm();

  constructor(@Inject(TAKE) protected readonly take: number) {}

  private createForm() {
    return new FormGroup({
      folder: new FormControl<string | undefined>(undefined, { nonNullable: true }),
      artist: new FormControl<string | undefined>(undefined, { nonNullable: true }),
      album: new FormControl<string | undefined>(undefined, { nonNullable: true }),
      year: new FormControl<number | undefined>(undefined, { nonNullable: true }),
      genre: new FormControl<string | undefined>(undefined, { nonNullable: true }),
      country: new FormControl<string | undefined>(undefined, { nonNullable: true }),
      transferred: new FormControl<boolean | undefined>(undefined, { nonNullable: true }),
      hasLyrics: new FormControl<boolean | undefined>(undefined, { nonNullable: true }),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.request && this.request) {
      const { skip: _skip, take: _take, cancel: _cancel, ...value } = this.request;
      this.form.patchValue(value);
    }
  }

  onSearch() {
    const request = this.form.getRawValue();
    objectKeys(request).forEach((k) => request[k] == null && delete request[k]);
    this.searchRequest.emit(request);
  }
}
