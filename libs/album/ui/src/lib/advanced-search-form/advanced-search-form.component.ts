import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  imports: [RouterModule, ReactiveFormsModule, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatInputModule, MatButtonModule],
  selector: 'app-advanced-search-form',
  templateUrl: './advanced-search-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchFormComponent {
  protected readonly take = inject(TAKE);
  private readonly fb = inject(NonNullableFormBuilder);

  request = input.required<SearchRequest | null | undefined>();
  searchRequest = output<SearchRequest>();

  form = this.createForm();

  constructor() {
    effect(() => {
      const request = this.request();

      if (request) {
        this.form.patchValue(request);
      }
    });
  }

  private createForm() {
    return this.fb.group({
      folder: this.fb.control<string | undefined>(undefined),
      artist: this.fb.control<string | undefined>(undefined),
      album: this.fb.control<string | undefined>(undefined),
      year: this.fb.control<number | undefined>(undefined),
      genre: this.fb.control<string | undefined>(undefined),
      country: this.fb.control<string | undefined>(undefined),
      transferred: this.fb.control<boolean | undefined>(undefined),
      hasLyrics: this.fb.control<boolean | undefined>(undefined),
    });
  }

  onSearch() {
    const request = this.form.getRawValue();
    objectKeys(request).forEach((k) => request[k] == null && delete request[k]);
    this.searchRequest.emit(request);
  }
}
