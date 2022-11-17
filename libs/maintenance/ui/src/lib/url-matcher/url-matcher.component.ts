import { NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { UrlMatcher } from '@metal-p3/maintenance/domain';

@Component({
  standalone: true,
  imports: [NgIf, NgSwitch, NgSwitchCase, RouterModule, MatTableModule, MatIconModule, MatTooltipModule],
  selector: 'app-url-matcher',
  templateUrl: './url-matcher.component.html',
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
