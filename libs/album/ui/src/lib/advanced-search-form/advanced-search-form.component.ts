import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { TAKE } from '@metal-p3/album/domain';
import { SearchRequest } from '@metal-p3/api-interfaces';
import { PreventDefaultDirective } from '@metal-p3/shared/utils';

type SearchFormModel = {
  folder: string;
  artist: string;
  album: string;
  year: number | null;
  genre: string;
  country: string;
  transferred: boolean | null;
  hasLyrics: boolean | null;
  played: boolean | null;
};

@Component({
  imports: [RouterModule, FormField, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatInputModule, MatButtonModule, PreventDefaultDirective],
  selector: 'app-advanced-search-form',
  templateUrl: './advanced-search-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchFormComponent {
  protected readonly take = inject(TAKE);

  request = input.required<SearchRequest | null | undefined>();
  searchRequest = output<SearchRequest>();

  protected readonly model = linkedSignal(() => this.normaliseSearchRequest(this.request()));
  protected readonly searchForm = form(this.model);

  onSearch() {
    const { year, transferred, hasLyrics, played, ...rest } = this.model();
    const request: SearchRequest = {
      ...rest,
      take: this.take,
      skip: 0,
      ...(year !== null && { year }),
      ...(transferred !== null && { transferred }),
      ...(hasLyrics !== null && { hasLyrics }),
      ...(played !== null && { played }),
    };

    this.searchRequest.emit(request);
  }

  onClear() {
    this.model.set({
      folder: '',
      artist: '',
      album: '',
      year: null,
      genre: '',
      country: '',
      transferred: null,
      hasLyrics: null,
      played: null,
    });
    this.searchRequest.emit({ take: this.take, skip: 0 });
  }

  private normaliseSearchRequest(request: SearchRequest | null | undefined): SearchFormModel {
    return {
      folder: request?.folder || '',
      artist: request?.artist || '',
      album: request?.album || '',
      year: request?.year ?? null,
      genre: request?.genre || '',
      country: request?.country || '',
      transferred: request?.transferred ?? null,
      hasLyrics: request?.hasLyrics ?? null,
      played: request?.played ?? null,
    };
  }
}
