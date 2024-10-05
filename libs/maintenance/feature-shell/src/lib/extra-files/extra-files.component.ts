import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { ExtraFilesComponent, ExtraFilesToolbarComponent } from '@metal-p3/maintenance/ui';
import { BehaviorSubject } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';

@Component({
  standalone: true,
  imports: [AsyncPipe, ExtraFilesToolbarComponent, ExtraFilesComponent],
  selector: 'app-extra-files-shell',
  templateUrl: './extra-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesShellComponent implements OnInit {
  private readonly service = inject(FileSystemMaintenanceService);
  private readonly albumService = inject(AlbumService);
  private readonly basePath = inject(BASE_PATH);
  private readonly destroyRef = inject(DestroyRef);

  private extraFiles: string[] = [];
  private extraFiles$$ = new BehaviorSubject<string[]>([]);
  private running$$ = new BehaviorSubject<boolean>(true);

  extraFiles$ = this.extraFiles$$.asObservable();
  running$ = this.running$$.asObservable();

  ngOnInit(): void {
    this.service.getExtraFiles().subscribe();

    this.updateProgress();
  }

  updateProgress() {
    this.service
      .extraFilesUpdate()
      .pipe(
        tap((folder: string) => {
          this.extraFiles.push(folder);
          this.extraFiles$$.next(this.extraFiles);
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
        concatMap(() => this.service.cancelExtraFiles()),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.running$$.next(false)),
      )
      .subscribe();
  }

  onStop() {
    this.onComplete();
  }
}
