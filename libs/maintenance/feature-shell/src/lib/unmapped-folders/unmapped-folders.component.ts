import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { AlbumActions } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-unmapped-folders-shell',
  templateUrl: './unmapped-folders.component.html',
  styleUrls: ['./unmapped-folders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnmappedFoldersShellComponent {
  unmappedFolders$ = this.service.getUnmappedFolders().pipe(shareReplay());

  constructor(
    private readonly store: Store,
    private readonly service: FileSystemMaintenanceService,
    private readonly albumService: AlbumService,
    @Inject(BASE_PATH) private readonly basePath: string
  ) {}

  onOpenFolder(folder: string) {
    this.albumService.openFolder(`${this.basePath}/${folder}`).subscribe();
  }

  onSearch(folder: string) {
    this.store.dispatch(AlbumActions.loadAlbums({ request: { skip: 0, take: 40, criteria: folder } }));
  }

  onAdd(folder: string) {
    this.store.dispatch(AlbumActions.addNewAlbum({ folder }));
  }

  onDelete(path: string) {
    this.service.deleteFolder(path).subscribe();
  }
}
