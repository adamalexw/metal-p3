import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { UrlMatcher } from '@metal-p3/maintenance/domain';

@Component({
  imports: [RouterModule, MatTableModule, MatIconModule, MatTooltipModule],
  selector: 'app-url-matcher',
  templateUrl: './url-matcher.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherComponent {
  albums = input<UrlMatcher[] | null | undefined>([]);

  displayedColumns = ['band', 'artistUrl', 'album', 'albumUrl', 'result', 'complete'];
  dataSource = new MatTableDataSource<UrlMatcher>();

  constructor() {
    effect(() => {
      const albums = this.albums();

      if (albums) {
        this.dataSource.data = albums;
      }
    });
  }
}
