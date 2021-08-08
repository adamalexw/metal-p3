import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { AlbumService } from '@metal-p3/album/data-access';
import { BASE_PATH } from '@metal-p3/album/domain';
import { FileSystemMaintenanceService } from '@metal-p3/maintenance/data-access';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { concatMapTo, tap } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'app-extra-files-shell',
  templateUrl: './extra-files.component.html',
  styleUrls: ['./extra-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraFilesShellComponent implements OnInit {
  private extraFiles: string[] = [];
  private extraFiles$$ = new BehaviorSubject<string[]>([]);
  private running$$ = new BehaviorSubject<boolean>(true);

  extraFiles$ = this.extraFiles$$.asObservable();
  running$ = this.running$$.asObservable();

  constructor(private readonly service: FileSystemMaintenanceService, private readonly albumService: AlbumService, @Inject(BASE_PATH) private readonly basePath: string) {}

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
        })
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
      .pipe(untilDestroyed(this), concatMapTo(this.service.cancelExtraFiles()))
      .subscribe(() => this.running$$.next(false));
  }

  onStop() {
    this.onComplete();
  }
}
