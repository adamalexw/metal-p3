import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UrlMatcher } from '@metal-p3/maintenance/domain';

@Component({
  selector: 'app-url-matcher',
  templateUrl: './url-matcher.component.html',
  styleUrls: ['./url-matcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlMatcherComponent implements OnChanges {
  @Input()
  albums: UrlMatcher[] | null | undefined = [];

  displayedColumns = ['band', 'artistUrl', 'album', 'albumUrl', 'result', 'complete'];
  dataSource: MatTableDataSource<UrlMatcher> = new MatTableDataSource();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.albums && this.albums) {
      this.dataSource = new MatTableDataSource(this.albums);
    }
  }
}
