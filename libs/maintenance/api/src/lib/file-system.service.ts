import { BASE_PATH_TOKEN } from '@metal-p3/api-interfaces';
import { DbService } from '@metal-p3/shared/database';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Inject, Injectable } from '@nestjs/common';
import { difference } from 'lodash';
import { join } from 'path';
import { asyncScheduler, filter, finalize, from, map, Observable, observeOn, Subject, takeUntil, tap } from 'rxjs';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Injectable()
export class FileSystemMaintenanceService {
  notifier = new Subject<void>();

  constructor(
    private readonly dbService: DbService,
    private readonly fileSystemService: FileSystemService,
    private readonly maintenanceGateway: MaintenanceGateway,
    @Inject(BASE_PATH_TOKEN) private readonly basePath: string,
  ) {}

  getUnmappedFolders(): Observable<string[]> {
    return from(this.dbService.folders()).pipe(
      map((folders) => {
        const fsFolders = this.fileSystemService.getFolders(this.basePath);

        return difference(
          fsFolders,
          folders.map((f) => f.Folder).filter((f): f is string => f !== undefined),
        );
      }),
    );
  }

  getMissingFolders(): Observable<string[]> {
    return from(this.dbService.folders()).pipe(
      map((folders) => {
        const fsFolders = this.fileSystemService.getFolders(this.basePath);

        return difference(
          folders.map((f) => f.Folder).filter((f): f is string => f !== undefined),
          fsFolders,
        );
      }),
    );
  }

  deleteFolder(folder: string) {
    this.fileSystemService.deleteFolder(join(this.basePath, folder));
  }

  extraFiles() {
    this.notifier = new Subject();

    const folders = this.fileSystemService.getFolders(this.basePath);

    from(folders)
      .pipe(
        observeOn(asyncScheduler),
        takeUntil(this.notifier),
        filter((folder) => this.fileSystemService.hasExtraFiles(this.basePath, folder)),
        tap((folder) => this.maintenanceGateway.extraFiles(folder)),
        finalize(() => this.maintenanceGateway.extraFilesComplete()),
      )
      .subscribe();
  }

  cancelExtraFiles(): void {
    this.notifier.next();
    this.notifier.complete();
  }
}
