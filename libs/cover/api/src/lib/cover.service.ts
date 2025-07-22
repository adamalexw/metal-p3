import { FileSystemService } from '@metal-p3/shared/file-system';
import { TrackService } from '@metal-p3/track/api';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { selectCover } from 'music-metadata';
import * as path from 'path';
import { EMPTY, Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as sharp from 'sharp';

@Injectable()
export class CoverService {
  readonly cover = 'Cover.jpg';

  constructor(
    private readonly trackService: TrackService,
    private readonly fileSystemService: FileSystemService,
    private readonly httpService: HttpService,
  ) {}

  getCover(location: string): Observable<string> {
    const coverPath = path.join(location, this.cover);

    if (fs.existsSync(coverPath)) {
      return this.getCoverFromImageFile(coverPath);
    }

    if (path.extname(location) == '.mp3') {
      return this.getCoverFromAudioFile(location).pipe(filter(Boolean));
    }

    try {
      const files = this.fileSystemService.getFiles(location);

      if (files.length) {
        location = path.join(location, files[0]);

        return this.getCoverFromAudioFile(location);
      }
    } catch (error) {
      console.error(error);
    }

    return EMPTY;
  }

  private getCoverFromAudioFile(location: string): Observable<string> {
    return this.trackService.getMetadata(location).pipe(
      map((metadata) => selectCover(metadata.common.picture)),
      map((cover) => (cover?.data ? this.toBase64Image(Buffer.from(cover.data)) : '')),
    );
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
    const location = path.join(folder, this.cover);
    const buffer = Buffer.from(cover.replace('data:image/png;base64,', ''), 'base64');

    try {
      sharp(buffer).resize({ height: 500, width: 500 }).toFile(location);
    } catch (error) {
      console.error(error);
    }
  }

  resize() {
    const folders = this.fileSystemService.getFolders('m:/mp3');

    for (let index = 0; index < folders.length; index++) {
      const f = `m:/mp3/${folders[index]}/${this.cover}`;

      if (fs.existsSync(f)) {
        console.log(((index / folders.length) * 100).toFixed(1), folders[index]);

        sharp(f).resize({ height: 500 }).toFile(`m:/mp3/${folders[index]}/${this.cover}`);
      }

      if (index > 10) {
        return;
      }
    }
  }
}
