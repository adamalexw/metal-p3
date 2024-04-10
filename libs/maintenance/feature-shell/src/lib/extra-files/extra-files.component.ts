import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { ExtraFilesComponent, ExtraFilesToolbarComponent } from '@metal-p3/maintenance/ui';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { concatMap, finalize, tap } from 'rxjs/operators';

@UntilDestroy()
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
        untilDestroyed(this),
        tap((folder: string) => {
          this.extraFiles.push(folder);
          this.extraFiles$$.next(this.extraFiles);
        }),
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
        untilDestroyed(this),
        concatMap(() => this.service.cancelExtraFiles()),
        finalize(() => this.running$$.next(false)),
      )
      .subscribe();
  }

  onStop() {
    this.onComplete();
  }
}
