import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { ExtraFilesComponent, ExtraFilesToolbarComponent } from '@metal-p3/maintenance/ui';
import { concatMap, tap } from 'rxjs';

@Component({
  imports: [ExtraFilesToolbarComponent, ExtraFilesComponent],
  selector: 'app-extra-files-shell',
  templateUrl: './extra-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesShellComponent implements OnInit {
  private readonly service = inject(FileSystemMaintenanceService);
  private readonly albumService = inject(AlbumService);
  private readonly basePath = inject(BASE_PATH);
  private readonly destroyRef = inject(DestroyRef);

  extraFiles = signal<string[]>([]);
  running = signal<boolean>(true);

  ngOnInit(): void {
    this.service.getExtraFiles().subscribe();

    this.updateProgress();
  }

  updateProgress() {
    this.service
      .extraFilesUpdate()
      .pipe(
        tap((folder: string) => {
          this.extraFiles.update(files => [...files, folder]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.onComplete();
  }

  onOpenFolder(folder: string) {
    this.albumService.openFolder(`${this.basePath}/${folder}`).subscribe();
  }

  onComplete() {
    this.service
      .extraFilesComplete()
      .pipe(
        tap(() => this.running.set(false)),
        concatMap(() => this.service.cancelExtraFiles()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onStop() {
    this.onComplete();
  }
}
