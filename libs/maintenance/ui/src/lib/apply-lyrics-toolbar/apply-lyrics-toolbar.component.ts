import { ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-lyrics-toolbar',
  templateUrl: './apply-lyrics-toolbar.component.html',
  styleUrls: ['./apply-lyrics-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ApplyLyricsToolbarComponent {
  @Input()
  applying = false;

  @Input()
  albumUrl: string | null | undefined;

  @Input()
  albumId!: number;

  @Input()
  coverLoading = false;

  @Input()
  cover: string | null | undefined;

  @Input()
  folder: string | null | undefined;

  @Input()
  trackTransferring = false;

  @Input()
  showClose = true;

  @Output()
  readonly apply = new EventEmitter<void>();

  @Output()
  readonly transfer = new EventEmitter<void>();

  @Output()
  readonly done = new EventEmitter<void>();

  constructor(@Inject(WINDOW) readonly windowRef: Window) {}

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }
}
