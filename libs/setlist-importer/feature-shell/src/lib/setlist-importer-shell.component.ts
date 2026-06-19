import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SetlistImporterStore } from '@metal-p3/setlist-importer/data-access';
import { ReviewTableComponent, UrlListEditorComponent } from '@metal-p3/setlist-importer/ui';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';

@Component({
  imports: [NavToolbarComponent, UrlListEditorComponent, ReviewTableComponent],
  selector: 'app-setlist-importer-shell',
  templateUrl: './setlist-importer-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetlistImporterShellComponent {
  private readonly store = inject(SetlistImporterStore);

  readonly urls = this.store.urls;
  readonly tracks = this.store.tracks;
  readonly scraping = this.store.scraping;
  readonly matching = this.store.matching;
  readonly creating = this.store.creating;
  readonly error = this.store.error;

  onUrlsChange(urls: string[]) {
    this.store.setUrls(urls);
  }

  onScrape() {
    this.store.scrape();
  }

  onToggleSelection(key: string) {
    this.store.toggleTrackSelection(key);
  }

  onSetAllSelection(selected: boolean) {
    this.store.setAllSelection(selected);
  }

  onCreatePlaylist(name: string) {
    this.store.createPlaylist(name);
  }
}
