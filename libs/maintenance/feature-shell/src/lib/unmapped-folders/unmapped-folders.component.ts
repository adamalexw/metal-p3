import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { UnmappedFoldersComponent } from '@metal-p3/maintenance/ui';
import { AlbumActions } from '@metal-p3/shared/data-access';
import { Store } from '@ngrx/store';
import { shareReplay } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [AsyncPipe, UnmappedFoldersComponent],
  selector: 'app-unmapped-folders-shell',
  templateUrl: './unmapped-folders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnmappedFoldersShellComponent {
  private readonly store = inject(Store);
  private readonly service = inject(FileSystemMaintenanceService);
  private readonly albumService = inject(AlbumService);
  private readonly basePath = inject(BASE_PATH);

  unmappedFolders$ = this.service.getUnmappedFolders().pipe(shareReplay());

  onOpenFolder(folder: string) {
    this.albumService.openFolder(`${this.basePath}/${folder}`).subscribe();
  }

  onSearch(folder: string) {
    this.store.dispatch(AlbumActions.loadAlbums({ request: { skip: 0, take: 40, folder } }));
  }

  onAdd(folder: string) {
    this.store.dispatch(AlbumActions.addNewAlbum({ folder }));
  }

  onDelete(path: string) {
    this.service.deleteFolder(path).subscribe();
  }
}
