import { FileSystemService } from '@metal-p3/shared/file-system';
import { TrackService } from '@metal-p3/track/api';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { selectCover } from 'music-metadata';
import * as path from 'path';
import { catchError, EMPTY, filter, from, map, Observable, switchMap } from 'rxjs';
import sharpFn from 'sharp';

const coverPattern = /^Cover\.jpg$/i;

@Injectable()
export class CoverService {
  readonly cover = 'Cover.jpg';

  constructor(
    private readonly trackService: TrackService,
    private readonly fileSystemService: FileSystemService,
    private readonly httpService: HttpService,
  ) {}

  getCover(location: string): Observable<Buffer> {
    if (!location) {
      Logger.warn('getCover called with empty location');
      return EMPTY;
    }

    if (!fs.existsSync(location)) {
      Logger.warn(`getCover: location does not exist: "${location}"`);
      return EMPTY;
    }

    const coverPath = path.join(location, this.cover);

    if (fs.existsSync(coverPath)) {
      return this.getCoverFromImageFile(coverPath).pipe(
        catchError((error) => {
          Logger.error(`Failed to read cover image "${coverPath}": ${error}`);
          return EMPTY;
        }),
      );
    }

    if (path.extname(location) == '.mp3') {
      return this.getCoverFromAudioFile(location).pipe(
        filter(Boolean),
        catchError((error) => {
          Logger.error(`Failed to extract cover from audio file "${location}": ${error}`);
          return EMPTY;
        }),
      );
    }

    try {
      const files = this.fileSystemService.getFiles(location);
      const audioFile = files?.filter((f) => path.extname(f) == '.mp3')?.[0];

      if (audioFile) {
        location = path.join(location, audioFile);
        return this.getCoverFromAudioFile(location).pipe(
          catchError((error) => {
            Logger.error(`Failed to extract cover from audio file "${location}": ${error}`);
            return EMPTY;
          }),
        );
      }
    } catch (error) {
      Logger.error(`Failed to list files in "${location}": ${error}`);
    }

    return EMPTY;
  }

  private getCoverFromAudioFile(location: string): Observable<Buffer> {
    return this.trackService.getMetadata(location).pipe(
      map((metadata) => selectCover(metadata.common.picture)),
      filter((cover): cover is NonNullable<typeof cover> => !!cover?.data),
      map((cover) => cover.data),
    );
  }

  private getCoverFromImageFile(location: string): Observable<Buffer> {
    return from(fs.promises.readFile(location));
  }

  downloadCover(url: string | string[]): Observable<Buffer> {
    if (Array.isArray(url)) {
      url = url[url.length - 1];
    }

    const resolvedUrl = this.resolveImageUrl(url);

    if (!this.isDirectImageUrl(resolvedUrl)) {
      return this.extractOgImageUrl(resolvedUrl).pipe(
        map((imageUrl) => {
          if (!imageUrl) throw new Error(`Could not extract og:image from page: ${resolvedUrl}`);
          return imageUrl;
        }),
        switchMap((imageUrl) => this.httpService.get(imageUrl, { responseType: 'arraybuffer' }).pipe(map((response) => Buffer.from(response.data)))),
      );
    }

    return this.httpService.get(resolvedUrl, { responseType: 'arraybuffer' }).pipe(map((response) => Buffer.from(response.data)));
  }

  private resolveImageUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Google redirect: google.com/url?url=ACTUAL or /imgres?imgurl=ACTUAL
      if (parsed.hostname.endsWith('google.com')) {
        const imgUrl = parsed.searchParams.get('imgurl') ?? parsed.searchParams.get('url');
        if (imgUrl) return imgUrl;
      }
    } catch {
      // not a valid URL — return as-is
    }
    return url;
  }

  private isDirectImageUrl(url: string): boolean {
    try {
      const { pathname } = new URL(url);
      return /\.(jpe?g|png|gif|webp|bmp|tiff?)(\?.*)?$/i.test(pathname);
    } catch {
      return false;
    }
  }

  private extractOgImageUrl(pageUrl: string): Observable<string | null> {
    return this.httpService.get<string>(pageUrl, { responseType: 'text' }).pipe(
      map((response) => {
        const match = response.data.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
        return match ? match[1] : null;
      }),
    );
  }

  async saveCover(folder: string, cover: string): Promise<void> {
    const location = path.join(folder, this.cover);
    const base64Data = cover.replace(/^data:image\/[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const tempLocation = `${location}.tmp`;

    // Delete any cover variants with non-ASCII characters in the name (e.g. Сover.jpg with Cyrillic С)
    try {
      const coverExt = /\.jpe?g$/i;
      const files = fs.readdirSync(folder);
      for (const file of files) {
        if (coverPattern.test(file)) continue; // already an exact ASCII cover — skip
        // eslint-disable-next-line no-control-regex
        const hasNonAscii = /[^\x00-\x7F]/.test(file);
        if (hasNonAscii && coverExt.test(file)) {
          const filePath = path.join(folder, file);
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            Logger.warn(`Failed to delete cover variant "${filePath}": ${e}`);
          }
        }
      }
    } catch (error) {
      Logger.warn(`Failed to scan for cover variants in "${folder}": ${error}`);
    }

    try {
      await sharpFn(buffer).resize({ height: 500, width: 500 }).toFile(tempLocation);

      fs.renameSync(tempLocation, location);
    } catch (error) {
      // clean up temp file if it exists
      if (fs.existsSync(tempLocation)) {
        try {
          fs.unlinkSync(tempLocation);
        } catch {
          // ignore cleanup errors
        }
      }

      Logger.error(`Failed to save cover to "${location}": ${error}`);
      throw new Error(`Failed to save cover: ${error}`);
    }
  }

  async resize() {
    const folders = this.fileSystemService.getFolders('m:/mp3');

    for (let index = 0; index < folders.length; index++) {
      const f = `m:/mp3/${folders[index]}/${this.cover}`;

      if (fs.existsSync(f)) {
        console.log(((index / folders.length) * 100).toFixed(1), folders[index]);

        const tempFile = `${f}.tmp`;
        try {
          await sharpFn(f).resize({ height: 500 }).toFile(tempFile);
          fs.unlinkSync(f);
          fs.renameSync(tempFile, f);
        } catch (error) {
          Logger.error(`Failed to resize cover "${f}": ${error}`);
          if (fs.existsSync(tempFile)) {
            try {
              fs.unlinkSync(tempFile);
            } catch {
              // ignore cleanup errors
            }
          }
        }
      }

      if (index > 10) {
        return;
      }
    }
  }
}
