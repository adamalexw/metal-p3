import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CoverComponent } from '@metal-p3/cover/ui';
import { NavToolbarComponent } from '@metal-p3/shared/navigation';
import { WA_WINDOW } from '@ng-web-apis/common';

@Component({
  imports: [RouterModule, NavToolbarComponent, CoverComponent, MatIconModule],
  selector: 'app-lyrics-toolbar',
  templateUrl: './apply-lyrics-toolbar.component.html',
  styleUrls: ['./apply-lyrics-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ApplyLyricsToolbarComponent {
  protected readonly windowRef = inject(WA_WINDOW);

  readonly applying = input(false);
  readonly applied = input(false);
  readonly albumUrl = input<string>();
  readonly albumId = input<number>();
  readonly coverLoading = input(false);
  readonly cover = input<string>();
  readonly folder = input<string>();
  readonly trackTransferring = input(false);
  readonly showClose = input(true);

  readonly apply = output<void>();
  readonly transfer = output<void>();
  readonly done = output<void>();

  openLink(url: string) {
    this.windowRef.open(url, '_blank');
  }
}
