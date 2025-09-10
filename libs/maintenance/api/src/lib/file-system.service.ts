import { DbService } from '@metal-p3/shared/database';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Inject, Injectable } from '@nestjs/common';
import { difference } from 'lodash';
import { join } from 'path';
import { Observable, Subject, finalize, from, map, of, takeUntil, tap } from 'rxjs';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Injectable()
export class FileSystemMaintenanceService {
  notifier = new Subject<void>();

  constructor(
    private readonly dbService: DbService,
    private readonly fileSystemService: FileSystemService,
    private readonly maintenanceGateway: MaintenanceGateway,
    @Inject('BASE_PATH') private readonly basePath: string,
  ) {}

  getUnmappedFolders(): Observable<string[]> {
    return from(this.dbService.folders()).pipe(
      map((folders) => {
        const fsFolders = this.fileSystemService.getFolders(this.basePath);

        return difference(
          fsFolders,
          folders.map((f) => f.Folder),
        );
      }),
    );
  }

  getMissingFolders(): Observable<string[]> {
    return from(this.dbService.folders()).pipe(
      map((folders) => {
        const fsFolders = this.fileSystemService.getFolders(this.basePath);

        return difference(
          folders.map((f) => f.Folder),
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

    of(this.fileSystemService.getFolders(this.basePath))
      .pipe(
        takeUntil(this.notifier),
        tap((folders) => {
          for (let index = 0; index < folders.length; index++) {
            const folder = folders[index];
            if (this.fileSystemService.hasExtraFiles(this.basePath, folder)) {
              this.maintenanceGateway.extraFiles(folder);
            }
          }
        }),
        finalize(() => this.maintenanceGateway.extraFilesComplete()),
      )
      .subscribe();
  }

  cancelExtraFiles(): void {
    this.notifier.next();
    this.notifier.complete();
  }
}
