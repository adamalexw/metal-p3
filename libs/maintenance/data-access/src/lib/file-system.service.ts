import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API } from '@metal-p3/album/domain';
import { EXTRA_FILES, EXTRA_FILES_COMPLETE } from '@metal-p3/api-interfaces';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileSystemMaintenanceService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API);
  private readonly socket = inject(Socket);

  private readonly baseUrl = `${this.api}maintenance/file-system`;

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
