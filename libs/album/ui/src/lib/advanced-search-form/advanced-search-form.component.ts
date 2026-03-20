import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { TAKE } from '@metal-p3/album/domain';
import { SearchRequest } from '@metal-p3/api-interfaces';

type SearchFormModel = {
  folder: string;
  artist: string;
  album: string;
  year: string;
  genre: string;
  country: string;
  transferred: boolean | null;
  hasLyrics: boolean | null;
};

@Component({
  imports: [RouterModule, FormField, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatInputModule, MatButtonModule],
  selector: 'app-advanced-search-form',
  templateUrl: './advanced-search-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchFormComponent {
  protected readonly take = inject(TAKE);

  request = input.required<SearchRequest | null | undefined>();
  searchRequest = output<SearchRequest>();

  protected model = signal<SearchFormModel>({
    folder: '',
    artist: '',
    album: '',
    year: '',
    genre: '',
    country: '',
    transferred: null,
    hasLyrics: null,
  });

  protected searchForm = form(this.model);

  constructor() {
    effect(() => {
      const request = this.request();

      if (request) {
        this.model.update((current) => ({ ...current, ...request, year: request.year != null ? String(request.year) : '' }));
      }
    });
  }

  onSearch(event: Event) {
    event.preventDefault();
    const { year, transferred, hasLyrics, ...strings } = this.model();
    const request: SearchRequest = {};

    for (const [k, v] of Object.entries(strings)) {
      if (v) {
        (request as Record<string, unknown>)[k] = v;
      }
    }

    if (year) {
      request.year = Number(year);
    }

    if (transferred !== null) {
      request.transferred = transferred;
    }

    if (hasLyrics !== null) {
      request.hasLyrics = hasLyrics;
    }

    this.searchRequest.emit(request);
  }

  onClear() {
    this.model.set({
      folder: '',
      artist: '',
      album: '',
      year: '',
      genre: '',
      country: '',
      transferred: null,
      hasLyrics: null,
    });
    this.searchRequest.emit({ take: this.take, skip: 0 });
  }
}
