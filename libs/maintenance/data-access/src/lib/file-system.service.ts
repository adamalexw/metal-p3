import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EXTRA_FILES, EXTRA_FILES_COMPLETE } from '@metal-p3/api-interfaces';
import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileSystemMaintenanceService {
  readonly baseUrl = '/api/maintenance/file-system';

  constructor(private http: HttpClient, private socket: Socket) {}

  getUnmappedFolders(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/unmappedFolders`);
  }

  deleteFolder(folder: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/folder?folder=${encodeURIComponent(folder)}`);
  }

  getExtraFiles(): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/extraFiles`);
  }

  extraFilesUpdate(): Observable<string> {
    return this.socket.fromEvent(EXTRA_FILES);
  }

  cancelExtraFiles(): Observable<never> {
    return this.http.get<never>(`${this.baseUrl}/cancel`);
  }

  extraFilesComplete(): Observable<boolean> {
    return this.socket.fromEvent(EXTRA_FILES_COMPLETE);
  }
}
