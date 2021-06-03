import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CloseFunctionality } from '@metal-p3/album/domain';

@Component({
  selector: 'app-album-header',
  templateUrl: './album-header.component.html',
  styleUrls: ['./album-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlbumHeaderComponent {
  @Input()
  folder: string | undefined;

  @Input()
  closeFunctionality: CloseFunctionality = 'close';

  @Output()
  readonly closeAlbum = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClose() {
    this.closeFunctionality === 'close' ? this.closeAlbum.emit() : this.router.navigate(['/']);
  }
}
