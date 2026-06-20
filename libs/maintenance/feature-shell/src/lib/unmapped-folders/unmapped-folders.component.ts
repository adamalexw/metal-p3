import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AlbumStore, AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { UnmappedFoldersComponent } from '@metal-p3/maintenance/ui';

@Component({
  imports: [UnmappedFoldersComponent],
  selector: 'app-unmapped-folders-shell',
  templateUrl: './unmapped-folders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnmappedFoldersShellComponent {
  private readonly albumStore = inject(AlbumStore);
  private readonly service = inject(FileSystemMaintenanceService);
  private readonly albumService = inject(AlbumService);
  private readonly basePath = inject(BASE_PATH);

  unmappedFolders = toSignal(this.service.getUnmappedFolders(), { initialValue: [] });

  onOpenFolder(folder: string) {
    this.albumService.openFolder(`${this.basePath}/${folder}`).subscribe();
  }

  onSearch(folder: string) {
    this.albumStore.loadAlbums({ request: { skip: 0, take: 40, folder }, cancel: false });
  }

  onAdd(folder: string) {
    this.albumService.addNewAlbum(folder).subscribe(albumDto => {
      this.albumStore.addAlbum({ ...albumDto });
    });
  }

  onDelete(path: string) {
    this.service.deleteFolder(path).subscribe();
  }
}
