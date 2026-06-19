import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  selector: 'app-url-list-editor',
  templateUrl: './url-list-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlListEditorComponent {
  readonly urls = input<string[]>([]);
  readonly scraping = input(false);

  readonly urlsChange = output<string[]>();
  readonly scrape = output<void>();

  readonly draft = signal('');

  readonly canScrape = computed(() => this.urls().length > 0 && !this.scraping());

  onPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text.includes('\n')) return;

    event.preventDefault();
    const candidates = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && this.isSetlistFmUrl(s));

    if (!candidates.length) return;

    const merged = Array.from(new Set([...this.urls(), ...candidates]));
    this.urlsChange.emit(merged);
    this.draft.set('');
  }

  onAdd() {
    const value = this.draft().trim();
    if (!value || !this.isSetlistFmUrl(value)) return;
    if (this.urls().includes(value)) {
      this.draft.set('');
      return;
    }
    this.urlsChange.emit([...this.urls(), value]);
    this.draft.set('');
  }

  onRemove(url: string) {
    this.urlsChange.emit(this.urls().filter((u) => u !== url));
  }

  onClear() {
    this.urlsChange.emit([]);
  }

  private isSetlistFmUrl(value: string): boolean {
    return /https?:\/\/(www\.)?setlist\.fm\/setlist\//i.test(value);
  }
}
