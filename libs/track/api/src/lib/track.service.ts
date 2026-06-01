import { RenameTrack, TrackDto } from '@metal-p3/api-interfaces';
import { AdbService } from '@metal-p3/shared/adb';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { IAudioMetadata, IOptions, parseFile } from 'music-metadata';
import * as NodeID3 from 'node-id3';
import { ReadStream } from 'node:fs';
import { basename, dirname, extname, join } from 'path';
import { EMPTY, Observable, catchError, concatAll, from, map, toArray } from 'rxjs';

@Injectable()
export class TrackService {
  constructor(
    private readonly fileSystemService: FileSystemService,
    private readonly adbService: AdbService,
  ) {}

  getTracks(files: string[]): Observable<TrackDto[]> {
    if (files.length) {
      const tags = files.map((file, index) => this.trackDetails(file, index));

      return from(tags).pipe(concatAll(), toArray());
    }

    return EMPTY;
  }

  getMetadata(file: string, options?: IOptions): Observable<IAudioMetadata> {
    return from(parseFile(file, options));
  }

  getTags(file: string): NodeID3.Tags {
    return NodeID3.read(file, { exclude: ['APIC'] });
  }

  trackDetails(file: string, index: number): Observable<TrackDto> {
    if (extname(file) === '.mp3') {
      return this.getMetadata(file, { skipCovers: true }).pipe(
        map((metadata) => this.mapTrack(file, metadata, index)),
        catchError((error) => {
          console.error(error);
          return EMPTY;
        }),
      );
    }

    return EMPTY;
  }

  private mapTrack(fullPath: string, mm: IAudioMetadata, index: number): TrackDto {
    return {
      id: index + 1,
      fullPath,
      folder: dirname(fullPath),
      file: basename(fullPath),
      album: mm.common.album,
      artist: mm.common.artist,
      bitrate: mm.format.bitrate,
      duration: mm.format.duration,
      genre: mm.common.genre && mm.common.genre[0],
      lyrics: this.extractLyrics(mm),
      syncedLyrics: this.readLrcSidecar(fullPath),
      title: mm.common.title ?? '',
      trackNumber: this.getTrackNo(mm.common.track),
      year: mm.common.year,
    };
  }

  private extractLyrics(mm: IAudioMetadata): string | undefined {
    if (mm.common.lyrics?.length) {
      return mm.common.lyrics[0];
    }
    // Fall back to raw native USLT frame when common.lyrics mapping fails
    const native = mm.native['ID3v2.4'] ?? mm.native['ID3v2.3'];
    return native?.find((t) => t.id === 'USLT')?.value?.text;
  }

  private getLrcSidecarPath(mp3Path: string): string {
    const dir = dirname(mp3Path);
    const stem = basename(mp3Path, extname(mp3Path));
    return join(dir, `${stem}.lrc`);
  }

  private readLrcSidecar(mp3Path: string): string | undefined {
    const lrcPath = this.getLrcSidecarPath(mp3Path);
    if (!existsSync(lrcPath)) return undefined;
    try {
      return readFileSync(lrcPath, 'utf8');
    } catch (error) {
      Logger.error(`Failed to read lrc sidecar at ${lrcPath}`, error);
      return undefined;
    }
  }

  private getTrackNo(track: { no: number | null; of: number | null }): string {
    return track.no?.toString().padStart(2, '0') || '00';
  }

  async saveTrack(track: TrackDto, coverImage?: NodeID3.Tags['image']): Promise<boolean> {
    let baseTags: Partial<NodeID3.Tags> = {
      album: track.album,
      artist: track.artist,
      year: track.year?.toString(),
      genre: track.genre,
    };

    const userDefinedText: NonNullable<NodeID3.Tags['userDefinedText']> = [];
    if (track.country) {
      userDefinedText.push({ description: 'COUNTRY', value: track.country });
    }
    if (track.albumUrl) {
      userDefinedText.push({ description: 'METAL_ARCHIVES_URL', value: track.albumUrl });
    }
    if (userDefinedText.length) {
      baseTags = { ...baseTags, userDefinedText };
    }

    if (track.lyrics) {
      baseTags = { ...baseTags, unsynchronisedLyrics: { text: track.lyrics, language: 'eng' } };
    }

    if (coverImage) {
      baseTags = { ...baseTags, image: coverImage };
    } else if (track.cover) {
      baseTags = { ...baseTags, image: this.buildCoverImage(track.cover) };
    }

    const tags = this.mapTrackToTags(track, baseTags);

    try {
      await this.updateTrack(tags, track.fullPath);
    } catch {
      this.fileSystemService.setReadAndWritePermission(track.fullPath);
      await this.updateTrack(tags, track.fullPath);
    }

    this.persistLrcSidecar(track);

    return true;
  }

  private persistLrcSidecar(track: TrackDto): void {
    if (track.syncedLyrics === undefined) return;

    const lrcPath = this.getLrcSidecarPath(track.fullPath);

    if (track.syncedLyrics === '') {
      if (existsSync(lrcPath)) {
        unlinkSync(lrcPath);
      }
      return;
    }

    writeFileSync(lrcPath, track.syncedLyrics, 'utf8');
  }

  async saveTracks(tracks: TrackDto[]): Promise<boolean> {
    const firstWithCover = tracks.find((t) => t.cover);
    let coverImage: NodeID3.Tags['image'] | undefined;

    if (firstWithCover?.cover) {
      coverImage = this.buildCoverImage(firstWithCover.cover);
    } else if (tracks[0]?.folder) {
      const coverPath = join(tracks[0].folder, 'Cover.jpg');
      if (existsSync(coverPath)) {
        coverImage = {
          mime: 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'front cover',
          imageBuffer: readFileSync(coverPath),
        };
      }
    }

    for (const track of tracks) {
      await this.saveTrack(track, coverImage);
    }

    return true;
  }

  private buildCoverImage(cover: string): NodeID3.Tags['image'] {
    const mimeMatch = cover.match(/^data:(image\/[^;]+);base64,/);
    const mime = (mimeMatch?.[1] ?? 'image/jpeg') as 'image/jpeg' | 'image/png';
    const base64Data = cover.replace(/^data:image\/[^;]+;base64,/, '');
    return {
      mime,
      type: {
        id: 3,
        name: 'front cover',
      },
      description: 'front cover',
      imageBuffer: Buffer.from(base64Data, 'base64'),
    };
  }

  private mapTrackToTags(track: TrackDto, baseTags: Partial<NodeID3.Tags>): NodeID3.Tags {
    const tags = { ...baseTags, trackNumber: track.trackNumber, title: track.title } as NodeID3.Tags;
    return tags;
  }

  async updateTrack(tags: NodeID3.Tags, location: string): Promise<void> {
    await NodeID3.Promise.update(tags, location);
  }

  renameTrack(track: TrackDto): RenameTrack {
    if (track.title) {
      const file = `${track.trackNumber} - ${this.fileSystemService.filenameValidator(track.title)}.mp3`;
      const fullPath = `${track.folder}/${file}`;

      try {
        this.fileSystemService.rename(track.fullPath, fullPath);
      } catch (error) {
        throw new Error(`Failed to rename track from "${track.fullPath}" to "${fullPath}": ${error}`);
      }

      return {
        file,
        fullPath,
      };
    }

    return {
      file: track.file,
      fullPath: track.fullPath,
    };
  }

  async transferTrack(file: string): Promise<void> {
    await this.adbService.transferFile(file);
  }

  playTrack(file: string): ReadStream {
    return createReadStream(file);
  }
}
