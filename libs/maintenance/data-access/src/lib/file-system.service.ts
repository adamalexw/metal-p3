import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { EXTRA_FILES, EXTRA_FILES_COMPLETE } from '@metal-p3/api-interfaces';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileSystemMaintenanceService {
  readonly baseUrl = `${this.api}maintenance/file-system`;

  constructor(
    private readonly http: HttpClient,
    private readonly socket: Socket,
    @Inject(API) private readonly api: string,
  ) {}

  getUnmappedFolders(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/unmappedFolders`);
  }

  deleteFolder(folder: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/folder?folder=${encodeURIComponent(folder)}`);
  }

  getExtraFiles(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/extraFiles`);
  }

  extraFilesUpdate(): Observable<string> {
    return this.socket.fromEvent(EXTRA_FILES);
  }

  cancelExtraFiles(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/cancel`);
  }

  extraFilesComplete(): Observable<boolean> {
    return this.socket.fromEvent(EXTRA_FILES_COMPLETE);
  }
}
