import { ChangeDetectionStrategy, Component, EventEmitter, Output, ViewEncapsulation, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CoverComponent } from '@metal-p3/cover/ui';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  standalone: true,
  imports: [RouterModule, NavToolbarComponent, CoverComponent, MatIconModule],
  selector: 'app-lyrics-toolbar',
  templateUrl: './apply-lyrics-toolbar.component.html',
  styleUrls: ['./apply-lyrics-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ApplyLyricsToolbarComponent {
  protected readonly windowRef = inject(WINDOW);

  applying = input(false);
  albumUrl = input<string | null | undefined>();
  albumId = input<number | null>();
  coverLoading = input(false);
  cover = input<string | null | undefined>();
  folder = input<string | null | undefined>();
  trackTransferring = input(false);
  showClose = input(true);

  @Output()
  readonly apply = new EventEmitter<void>();

  @Output()
  readonly transfer = new EventEmitter<void>();

  @Output()
  readonly done = new EventEmitter<void>();

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }
}
