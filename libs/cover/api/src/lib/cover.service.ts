import { FileSystemService } from '@metal-p3/shared/file-system';
import { TrackService } from '@metal-p3/track/api';
import { HttpService, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EMPTY, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CoverService {
  constructor(private readonly trackService: TrackService, private readonly fileSystemService: FileSystemService, private readonly httpService: HttpService) {}

  getCover(location: string): Observable<string> {
    if (path.extname(location) == '.mp3') {
      return this.getCoverFromAudioFile(location);
    }

    const folderPath = path.join(location, 'folder.jpg');

    if (fs.existsSync(folderPath)) {
      return this.getCoverFromImageFile(folderPath);
    }

    const coverPath = path.join(location, 'cover.jpg');

    if (fs.existsSync(coverPath)) {
      return this.getCoverFromImageFile(coverPath);
    }

    const files = this.fileSystemService.getFiles(location);

    if (files.length) {
      location = path.join(location, files[0]);
      return this.getCoverFromAudioFile(location);
    }

    return EMPTY;
  }

  private getCoverFromAudioFile(location: string): Observable<string> {
    return this.trackService.getMetadata(location).pipe(map((metadata) => metadata.common.picture?.length && this.toBase64Image(metadata.common.picture[0].data)));
  }

  private getCoverFromImageFile(location: string): Observable<string> {
    const data = fs.readFileSync(location);
    return of(Buffer.from(data).toString('base64'));
  }

  downloadCover(url: string | string[]): Observable<string> {
    if (Array.isArray(url)) {
      url = url[url.length - 1];
    }

    return this.httpService.get(url, { responseType: 'arraybuffer' }).pipe(map((response) => this.toBase64Image(response.data)));
  }

  private toBase64Image(buffer: Buffer): string {
    return buffer.toString('base64');
  }

  saveCover(folder: string, cover: string): void {
    const location = path.join(folder, 'Folder.jpg');
    const buffer = Buffer.from(cover.replace('data:image/png;base64,', ''), 'base64');

    fs.writeFile(location, buffer, (err) => {
      if (err) {
        return console.log(err);
      }
    });
  }
}
