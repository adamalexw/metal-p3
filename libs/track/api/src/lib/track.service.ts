import { RenameTrack, TrackDto, TransferPlaylistRequest } from '@metal-p3/api-interfaces';
import { AdbService } from '@metal-p3/shared/adb';
import { FileSystemService, isAudioFile } from '@metal-p3/shared/file-system';
import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { IAudioMetadata, IOptions, parseFile } from 'music-metadata';
import {
  ByteVector,
  Id3v2FrameClassType,
  Id3v2Settings,
  Id3v2Tag,
  Id3v2UserTextInformationFrame,
  Picture,
  PictureType,
  ReadStyle,
  File as TagLibFile,
  TagTypes,
  XiphComment,
} from 'node-taglib-sharp';
import { basename, dirname, extname, join } from 'path';
import { EMPTY, Observable, catchError, from, map, mergeAll, toArray } from 'rxjs';
import sharpFn from 'sharp';

const metadataParseConcurrency = 4;

export interface AudioCoverImage {
  mime: 'image/jpeg' | 'image/png';
  type: { id: number; name: string };
  description: string;
  imageBuffer: Buffer;
}

export interface AudioTags {
  album?: string;
  artist?: string;
  performerInfo?: string;
  year?: string;
  genre?: string;
  trackNumber?: string;
  title?: string;
  unsynchronisedLyrics?: { text: string; language: string };
  userDefinedText?: { description: string; value: string }[];
  image?: AudioCoverImage;
  comment?: { language: string; text: string };
}

@Injectable()
export class TrackService {
  constructor(
    private readonly fileSystemService: FileSystemService,
    private readonly adbService: AdbService,
  ) {}

  getTracks(files: string[]): Observable<TrackDto[]> {
    if (files.length) {
      const tags = files.map((file, index) => this.trackDetails(file, index));

      return from(tags).pipe(
        mergeAll(metadataParseConcurrency),
        toArray(),
        map((tracks) => tracks.sort((a, b) => a.id - b.id)),
      );
    }

    return EMPTY;
  }

  getMetadata(file: string, options?: IOptions): Observable<IAudioMetadata> {
    return from(parseFile(file, options));
  }

  getTags(file: string): AudioTags {
    const tagFile = TagLibFile.createFromPath(file, undefined, ReadStyle.None);
    try {
      const tag = tagFile.tag;
      const artist = tag.performers?.[0] ?? tag.albumArtists?.[0];
      return {
        album: tag.album,
        artist,
        performerInfo: tag.albumArtists?.[0] ?? artist,
        year: tag.year ? tag.year.toString() : undefined,
        genre: tag.genres?.[0],
        title: tag.title,
        trackNumber: tag.track ? tag.track.toString().padStart(2, '0') : undefined,
        unsynchronisedLyrics: tag.lyrics ? { language: 'eng', text: tag.lyrics } : undefined,
      };
    } finally {
      tagFile.dispose();
    }
  }

  trackDetails(file: string, index: number): Observable<TrackDto> {
    if (isAudioFile(file)) {
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
    // Fall back to raw native USLT frame (ID3v2) or Vorbis LYRICS / UNSYNCEDLYRICS comment (FLAC)
    const native = mm.native['ID3v2.4'] ?? mm.native['ID3v2.3'];
    const id3Lyrics = native?.find((t) => t.id === 'USLT')?.value?.text;
    if (id3Lyrics) {
      return id3Lyrics;
    }

    const vorbis = mm.native['vorbis'];
    const vorbisLyrics = vorbis?.find((t) => ['LYRICS', 'UNSYNCEDLYRICS'].includes(t.id.toUpperCase()))?.value;
    return typeof vorbisLyrics === 'string' ? vorbisLyrics : undefined;
  }

  private getLrcSidecarPath(audioPath: string): string {
    const dir = dirname(audioPath);
    const stem = basename(audioPath, extname(audioPath));
    return join(dir, `${stem}.lrc`);
  }

  private readLrcSidecar(audioPath: string): string | undefined {
    const lrcPath = this.getLrcSidecarPath(audioPath);
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

  async saveTrack(track: TrackDto, coverImage?: AudioCoverImage): Promise<boolean> {
    let baseTags: Partial<AudioTags> = {
      album: track.album,
      artist: track.artist,
      performerInfo: track.artist,
      year: track.year?.toString(),
      genre: track.genre,
    };

    const userDefinedText: NonNullable<AudioTags['userDefinedText']> = [];
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
      baseTags = { ...baseTags, image: await this.buildCoverImage(track.cover) };
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
    if (track.syncedLyrics === undefined || track.syncedLyrics === null) return;

    const lrcPath = this.getLrcSidecarPath(track.fullPath);

    try {
      if (track.syncedLyrics === '') {
        if (existsSync(lrcPath)) {
          unlinkSync(lrcPath);
        }
        return;
      }

      writeFileSync(lrcPath, track.syncedLyrics, 'utf8');
    } catch (error) {
      Logger.error(`Failed to persist lrc sidecar at ${lrcPath}`, error);
    }
  }

  async saveTracks(tracks: TrackDto[]): Promise<boolean> {
    const firstWithCover = tracks.find((t) => t.cover);
    let coverImage: AudioCoverImage | undefined;

    if (firstWithCover?.cover) {
      coverImage = await this.buildCoverImage(firstWithCover.cover);
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

  private async buildCoverImage(cover: string): Promise<AudioCoverImage> {
    const mimeMatch = cover.match(/^data:(image\/[^;]+);base64,/);
    const mime = (mimeMatch?.[1] ?? 'image/jpeg') as 'image/jpeg' | 'image/png';
    const base64Data = cover.replace(/^data:image\/[^;]+;base64,/, '');
    const buffer = await sharpFn(Buffer.from(base64Data, 'base64')).resize({ height: 500, width: 500 }).toBuffer();

    return {
      mime,
      type: {
        id: 3,
        name: 'front cover',
      },
      description: 'front cover',
      imageBuffer: buffer,
    };
  }

  private mapTrackToTags(track: TrackDto, baseTags: Partial<AudioTags>): AudioTags {
    const tags = { ...baseTags, trackNumber: track.trackNumber, title: track.title } as AudioTags;
    return tags;
  }

  async updateTrack(tags: AudioTags, location: string): Promise<void> {
    Id3v2Tag.language = 'eng';
    const file = TagLibFile.createFromPath(location, undefined, ReadStyle.None);
    try {
      if (tags.title !== undefined) {
        file.tag.title = tags.title;
      }
      if (tags.album !== undefined) {
        file.tag.album = tags.album;
      }
      if (tags.artist !== undefined) {
        file.tag.performers = tags.artist ? [tags.artist] : [];
      }
      if (tags.performerInfo !== undefined) {
        file.tag.albumArtists = tags.performerInfo ? [tags.performerInfo] : [];
      }
      if (tags.year !== undefined) {
        const parsedYear = Number.parseInt(tags.year, 10);
        file.tag.year = Number.isNaN(parsedYear) ? 0 : parsedYear;
      }
      if (tags.genre !== undefined) {
        file.tag.genres = tags.genre ? [tags.genre] : [];
      }
      if (tags.trackNumber !== undefined) {
        const parsedTrack = Number.parseInt(tags.trackNumber, 10);
        file.tag.track = Number.isNaN(parsedTrack) ? 0 : parsedTrack;
      }
      if (tags.unsynchronisedLyrics?.text !== undefined) {
        file.tag.lyrics = tags.unsynchronisedLyrics.text;
      }
      if (tags.image) {
        const pic = Picture.fromFullData(
          ByteVector.fromByteArray(new Uint8Array(tags.image.imageBuffer)),
          PictureType.FrontCover,
          tags.image.mime,
          tags.image.description,
        );
        file.tag.pictures = [pic];
      }
      if (tags.userDefinedText?.length) {
        const xiph = file.getTag(TagTypes.Xiph, false) as XiphComment | undefined;
        const id3v2 = file.getTag(TagTypes.Id3v2, false) as Id3v2Tag | undefined;
        for (const { description, value } of tags.userDefinedText) {
          if (xiph) {
            xiph.setFieldAsStrings(description, value);
          }
          if (id3v2) {
            const frames = id3v2.getFramesByClassType<Id3v2UserTextInformationFrame>(Id3v2FrameClassType.UserTextInformationFrame);
            let frame = Id3v2UserTextInformationFrame.findUserTextInformationFrame(frames, description, false);
            if (!frame) {
              frame = Id3v2UserTextInformationFrame.fromDescription(description, Id3v2Settings.defaultEncoding);
              id3v2.addFrame(frame);
            }
            frame.text = [value];
          }
        }
      }
      file.save();
    } finally {
      file.dispose();
    }
  }

  renameTrack(track: TrackDto): RenameTrack {
    if (track.title) {
      const ext = extname(track.fullPath || track.file || '') || '.mp3';
      const file = `${track.trackNumber} - ${this.fileSystemService.filenameValidator(track.title)}${ext}`;
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

  async transferPlaylist(request: TransferPlaylistRequest): Promise<void> {
    const name = request.name?.trim();
    if (!name) {
      throw new Error('Playlist name is required');
    }

    const tracks = [...request.tracks]
      .sort((a, b) => a.index - b.index)
      .map((t) => ({
        index: t.index,
        relativePath: `${this.fileSystemService.getParentFoler(t.fullPath)}/${this.fileSystemService.getFilename(t.fullPath)}`,
      }));

    await this.adbService.transferPlaylistManifest({
      version: 1,
      playlistId: request.playlistId,
      name,
      transferredAt: Date.now(),
      tracks,
    });
  }
}
