import { Track } from '@metal-p3/api-interfaces';
import { AdbService } from '@metal-p3/shared/adb';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Injectable } from '@nestjs/common';
import { createReadStream } from 'fs';
import * as mm from 'music-metadata';
import { read, Tags, update } from 'node-id3';
import { ReadStream } from 'node:fs';
import * as path from 'path';
import { EMPTY, from, Observable } from 'rxjs';
import { concatAll, map, toArray } from 'rxjs/operators';

@Injectable()
export class TrackService {
  constructor(private readonly fileSystemService: FileSystemService, private readonly adbService: AdbService) {}

  getTracks(files: string[]): Observable<Track[]> {
    if (files.length) {
      const tags = files.map((file, index) => this.trackDetails(file, index));

      return from(tags).pipe(concatAll(), toArray());
    }

    return EMPTY;
  }

  getMetadata(file: string, options?: mm.IOptions): Observable<mm.IAudioMetadata> {
    return from(mm.parseFile(file, options));
  }

  getTags(file: string): Tags {
    return read(file);
  }

  trackDetails(file: string, index: number): Observable<Track> {
    if (path.extname(file) == '.mp3') {
      return this.getMetadata(file, { skipCovers: true }).pipe(map((metadata) => this.mapTrack(file, this.getTags(file), metadata, index)));
    }

    return EMPTY;
  }

  private mapTrack(fullPath: string, tags: Tags, mm: mm.IAudioMetadata, index: number): Track {
    return {
      id: index + 1,
      fullPath,
      folder: path.dirname(fullPath),
      file: path.basename(fullPath),
      album: mm.common.album,
      artist: mm.common.artist,
      bitrate: mm.format.bitrate,
      duration: mm.format.duration,
      genre: mm.common.genre && mm.common.genre[0],
      lyrics: tags.unsynchronisedLyrics?.text,
      title: mm.common.title,
      trackNumber: this.getTrackNo(mm.common.track),
      year: mm.common.year,
      albumUrl: tags.fileUrl,
      artistUrl: tags.artistUrl ? tags.artistUrl[0] : undefined,
    };
  }

  private getTrackNo(track: { no: number | null; of: number | null }): string {
    return track.no.toString().padStart(2, '0');
  }

  saveTrack(track: Track): void {
    let baseTags: Partial<Tags> = {
      album: track.album,
      artist: track.artist,
      year: track.year?.toString(),
      genre: track.genre,
    };

    if (track.artistUrl) {
      baseTags = { ...baseTags, artistUrl: [track.artistUrl] };
    }

    if (track.albumUrl) {
      baseTags = { ...baseTags, fileUrl: track.albumUrl };
    }

    if (track.lyrics) {
      baseTags = { ...baseTags, unsynchronisedLyrics: { text: track.lyrics, language: 'eng' } };
    }

    if (track.cover) {
      const image = {
        mime: 'image/png',
        type: {
          id: 3,
          name: 'front cover',
        },
        description: 'front cover',
        imageBuffer: Buffer.from(track.cover.replace('data:image/png;base64,', ''), 'base64'),
      };

      baseTags = { ...baseTags, image };
    }

    const tags = this.mapTrackToTags(track, baseTags);
    this.updateTrack(tags, track.fullPath);
  }

  private mapTrackToTags(track: Track, baseTags: Tags): Tags {
    const tags = { ...baseTags, trackNumber: track.trackNumber, title: track.title } as Tags;
    return tags;
  }

  updateTrack(tags: Tags, location: string) {
    update(tags, location);
  }

  renameTrack(track: Track): string {
    const newName = `${track.folder}/${track.trackNumber} - ${this.fileSystemService.filenameValidator(track.title)}.mp3`;

    this.fileSystemService.renameFile(track.fullPath, newName);

    return newName;
  }

  async transferTrack(file: string): Promise<void> {
    await this.adbService.transferFile(file);
  }

  playTrack(file: string): ReadStream {
    return createReadStream(file);
  }
}
