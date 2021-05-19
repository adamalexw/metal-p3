import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Album } from '@metal-p3/albums/data-access';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItemComponent implements OnChanges {
  @Input()
  album: Album | undefined;

  @Output()
  getCover = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.album && this.album && !this.album.coverLoading && !this.album.cover) {
      this.getCover.emit();
    }
  }
}
