import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-album-form',
  templateUrl: './album-form.component.html',
  styleUrls: ['./album-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumFormComponent {
  @Input()
  form!: FormGroup;

  @Output()
  readonly lyricsPriority = new EventEmitter<void>();

  @Output()
  readonly findBandProps = new EventEmitter<string>();

  get albumUrl(): string {
    return this.form.get('albumUrl')?.value;
  }

  get artistUrl(): string {
    return this.form.get('artistUrl')?.value;
  }

  get hasLyrics(): boolean {
    return this.form.get('hasLyrics')?.value;
  }

  constructor(@Inject(WINDOW) readonly windowRef: Window) {}

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }

  getBandProps(url: string) {
    this.findBandProps.emit(url);
  }
}
