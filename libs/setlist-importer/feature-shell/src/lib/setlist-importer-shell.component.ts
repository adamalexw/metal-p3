import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  SetlistImporterActions,
  selectSetlistImporterCreating,
  selectSetlistImporterError,
  selectSetlistImporterMatching,
  selectSetlistImporterScraping,
  selectSetlistImporterTracks,
  selectSetlistImporterUrls,
} from '@metal-p3/setlist-importer/data-access';
import { ReviewTableComponent, UrlListEditorComponent } from '@metal-p3/setlist-importer/ui';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  imports: [NavToolbarComponent, UrlListEditorComponent, ReviewTableComponent],
  selector: 'app-setlist-importer-shell',
  templateUrl: './setlist-importer-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetlistImporterShellComponent {
  private readonly store = inject(Store);

  readonly urls = toSignal(this.store.select(selectSetlistImporterUrls), { initialValue: [] });
  readonly tracks = toSignal(this.store.select(selectSetlistImporterTracks), { initialValue: [] });
  readonly scraping = toSignal(this.store.select(selectSetlistImporterScraping), { initialValue: false });
  readonly matching = toSignal(this.store.select(selectSetlistImporterMatching), { initialValue: false });
  readonly creating = toSignal(this.store.select(selectSetlistImporterCreating), { initialValue: false });
  readonly error = toSignal(this.store.select(selectSetlistImporterError), { initialValue: undefined });

  onUrlsChange(urls: string[]) {
    this.store.dispatch(SetlistImporterActions.setUrls({ urls }));
  }

  onScrape() {
    this.store.dispatch(SetlistImporterActions.scrape());
  }

  onToggleSelection(key: string) {
    this.store.dispatch(SetlistImporterActions.toggleTrackSelection({ key }));
  }

  onSetAllSelection(selected: boolean) {
    this.store.dispatch(SetlistImporterActions.setAllSelection({ selected }));
  }

  onCreatePlaylist(name: string) {
    this.store.dispatch(SetlistImporterActions.createPlaylist({ name }));
  }
}
