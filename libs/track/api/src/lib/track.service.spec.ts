import { TrackDto } from '@metal-p3/api-interfaces';
import { AdbService } from '@metal-p3/shared/adb';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { parseFile } from 'music-metadata';
import { Id3v2FrameClassType, Id3v2Tag, Id3v2UserTextInformationFrame, ReadStyle, File as TagLibFile, TagTypes, XiphComment } from 'node-taglib-sharp';
import { tmpdir } from 'os';
import { basename, extname, join } from 'path';
import { firstValueFrom } from 'rxjs';
import { TrackService } from './track.service';

jest.mock('music-metadata', () => ({
  parseFile: jest.fn(),
}));

describe('TrackService.saveTrack tag building', () => {
  let service: TrackService;
  let updateSpy: jest.SpyInstance;

  const baseTrack: TrackDto = {
    id: 1,
    fullPath: '/music/test.mp3',
    folder: '/music',
    file: 'test.mp3',
    trackNumber: '01',
    title: 'Test Title',
    artist: 'Test Artist',
    album: 'Test Album',
    year: 2024,
    genre: 'Metal',
  } as TrackDto;

  beforeEach(() => {
    const fileSystem = { setReadAndWritePermission: jest.fn() } as unknown as FileSystemService;
    const adb = {} as AdbService;
    service = new TrackService(fileSystem, adb);
    updateSpy = jest.spyOn(service, 'updateTrack').mockResolvedValue();
  });

  it('writes only COUNTRY when only country is set', async () => {
    await service.saveTrack({ ...baseTrack, country: 'Sweden' });

    const tags = updateSpy.mock.calls[0][0];
    expect(tags.userDefinedText).toEqual([{ description: 'COUNTRY', value: 'Sweden' }]);
    expect(tags.comment).toBeUndefined();
  });

  it('writes only METAL_ARCHIVES_URL when only albumUrl is set', async () => {
    await service.saveTrack({ ...baseTrack, albumUrl: 'https://metal-archives.com/albums/foo' });

    const tags = updateSpy.mock.calls[0][0];
    expect(tags.userDefinedText).toEqual([{ description: 'METAL_ARCHIVES_URL', value: 'https://metal-archives.com/albums/foo' }]);
    expect(tags.comment).toBeUndefined();
  });

  it('writes both COUNTRY and METAL_ARCHIVES_URL in a single userDefinedText array', async () => {
    await service.saveTrack({ ...baseTrack, country: 'Sweden', albumUrl: 'https://metal-archives.com/albums/foo' });

    const tags = updateSpy.mock.calls[0][0];
    expect(tags.userDefinedText).toEqual([
      { description: 'COUNTRY', value: 'Sweden' },
      { description: 'METAL_ARCHIVES_URL', value: 'https://metal-archives.com/albums/foo' },
    ]);
    expect(tags.comment).toBeUndefined();
  });

  it('omits userDefinedText when neither country nor albumUrl is set', async () => {
    await service.saveTrack(baseTrack);

    const tags = updateSpy.mock.calls[0][0];
    expect(tags.userDefinedText).toBeUndefined();
    expect(tags.comment).toBeUndefined();
  });
});

describe('TrackService.getTracks', () => {
  let service: TrackService;

  beforeEach(() => {
    const fileSystem = { setReadAndWritePermission: jest.fn() } as unknown as FileSystemService;
    const adb = {} as AdbService;
    service = new TrackService(fileSystem, adb);
  });

  it('should preserve file order when metadata resolves out of order for both mp3 and flac', async () => {
    (parseFile as jest.Mock).mockImplementation((file: string) => {
      const trackNo = Number(basename(file, extname(file)));
      const delay = trackNo === 1 ? 30 : 1;
      return new Promise((resolve) =>
        setTimeout(() => resolve({ common: { title: `Track ${trackNo}`, track: { no: trackNo, of: null } }, format: {}, native: {} }), delay),
      );
    });

    const files = ['/music/1.mp3', '/music/2.flac', '/music/3.mp3', '/music/4.flac', '/music/5.mp3'];
    const tracks = await firstValueFrom(service.getTracks(files));

    expect(tracks.map((t) => t.id)).toEqual([1, 2, 3, 4, 5]);
    expect(tracks.map((t) => t.title)).toEqual(['Track 1', 'Track 2', 'Track 3', 'Track 4', 'Track 5']);
  });
});

describe('TrackService.renameTrack', () => {
  let service: TrackService;
  let renameMock: jest.Mock;

  beforeEach(() => {
    renameMock = jest.fn();
    const fileSystem = {
      rename: renameMock,
      filenameValidator: (name: string) => name,
    } as unknown as FileSystemService;
    service = new TrackService(fileSystem, {} as AdbService);
  });

  it('preserves .mp3 extension when renaming', () => {
    const result = service.renameTrack({
      id: 1,
      fullPath: '/music/track1.mp3',
      folder: '/music',
      file: 'track1.mp3',
      trackNumber: '01',
      title: 'Aces High',
    });

    expect(result).toEqual({
      file: '01 - Aces High.mp3',
      fullPath: '/music/01 - Aces High.mp3',
    });
    expect(renameMock).toHaveBeenCalledWith('/music/track1.mp3', '/music/01 - Aces High.mp3');
  });

  it('preserves .flac extension when renaming', () => {
    const result = service.renameTrack({
      id: 1,
      fullPath: '/music/track1.flac',
      folder: '/music',
      file: 'track1.flac',
      trackNumber: '01',
      title: 'Aces High',
    });

    expect(result).toEqual({
      file: '01 - Aces High.flac',
      fullPath: '/music/01 - Aces High.flac',
    });
    expect(renameMock).toHaveBeenCalledWith('/music/track1.flac', '/music/01 - Aces High.flac');
  });
});

describe('TrackService lrc sidecar', () => {
  let service: TrackService;
  let folder: string;
  let mp3Path: string;
  let lrcPath: string;
  const lrcText = '[00:01.00] line one\n[00:02.50] line two';

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'metal-p3-lrc-'));
    mp3Path = join(folder, '01 - Track.mp3');
    lrcPath = join(folder, '01 - Track.lrc');
    writeFileSync(mp3Path, '');
    const fileSystem = { setReadAndWritePermission: jest.fn() } as unknown as FileSystemService;
    const adb = {} as AdbService;
    service = new TrackService(fileSystem, adb);
    jest.spyOn(service, 'updateTrack').mockResolvedValue();
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  function track(syncedLyrics: string | undefined): TrackDto {
    return {
      id: 1,
      fullPath: mp3Path,
      folder,
      file: '01 - Track.mp3',
      trackNumber: '01',
      title: 'Track',
      syncedLyrics,
    } as TrackDto;
  }

  it('writes a sidecar when syncedLyrics is provided and none exists', async () => {
    await service.saveTrack(track(lrcText));
    expect(readFileSync(lrcPath, 'utf8')).toBe(lrcText);
  });

  it('overwrites an existing sidecar when syncedLyrics changes', async () => {
    writeFileSync(lrcPath, '[00:00.00] old');
    await service.saveTrack(track(lrcText));
    expect(readFileSync(lrcPath, 'utf8')).toBe(lrcText);
  });

  it('deletes the sidecar when syncedLyrics is an empty string', async () => {
    writeFileSync(lrcPath, '[00:00.00] old');
    await service.saveTrack(track(''));
    expect(existsSync(lrcPath)).toBe(false);
  });

  it('leaves an existing sidecar untouched when syncedLyrics is undefined', async () => {
    writeFileSync(lrcPath, '[00:00.00] preserved');
    await service.saveTrack(track(undefined));
    expect(readFileSync(lrcPath, 'utf8')).toBe('[00:00.00] preserved');
  });

  it('is a no-op when syncedLyrics is empty and no sidecar exists', async () => {
    await service.saveTrack(track(''));
    expect(existsSync(lrcPath)).toBe(false);
  });
});

describe('TrackService.updateTrack and getTags (node-taglib-sharp)', () => {
  let service: TrackService;
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'metal-p3-taglib-'));
    const fileSystem = { setReadAndWritePermission: jest.fn() } as unknown as FileSystemService;
    service = new TrackService(fileSystem, {} as AdbService);
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it('reads and writes tags, lyrics, and custom fields on a .flac file', async () => {
    const flacPath = join(folder, '01 - Test.flac');
    // Minimal valid FLAC stream: "fLaC" + last metadata block STREAMINFO (type 0, length 34)
    const flacHeader = new Uint8Array(42);
    flacHeader.set([0x66, 0x4c, 0x61, 0x43, 0x80, 0x00, 0x00, 0x22], 0);
    writeFileSync(flacPath, flacHeader);

    await service.updateTrack(
      {
        title: 'Painkiller',
        artist: 'Judas Priest',
        performerInfo: 'Judas Priest',
        album: 'Painkiller',
        year: '1990',
        genre: 'Heavy Metal',
        trackNumber: '01',
        unsynchronisedLyrics: { language: 'eng', text: 'Faster than a bullet' },
        userDefinedText: [
          { description: 'COUNTRY', value: 'United Kingdom' },
          { description: 'METAL_ARCHIVES_URL', value: 'https://www.metal-archives.com/albums/Judas_Priest/Painkiller/518' },
        ],
      },
      flacPath,
    );

    const readBack = service.getTags(flacPath);
    expect(readBack).toEqual({
      title: 'Painkiller',
      artist: 'Judas Priest',
      performerInfo: 'Judas Priest',
      album: 'Painkiller',
      year: '1990',
      genre: 'Heavy Metal',
      trackNumber: '01',
      unsynchronisedLyrics: { language: 'eng', text: 'Faster than a bullet' },
    });

    const flacFile = TagLibFile.createFromPath(flacPath, undefined, ReadStyle.None);
    try {
      const xiph = flacFile.getTag(TagTypes.Xiph, false) as XiphComment;
      expect(xiph.getFieldFirstValue('COUNTRY')).toBe('United Kingdom');
      expect(xiph.getFieldFirstValue('METAL_ARCHIVES_URL')).toBe('https://www.metal-archives.com/albums/Judas_Priest/Painkiller/518');
    } finally {
      flacFile.dispose();
    }
  });

  it('reads and writes tags, lyrics, and custom TXXX fields on an .mp3 file', async () => {
    const mp3Path = join(folder, '01 - Test.mp3');
    // Minimal ID3v2.3 header + dummy payload
    const mp3Header = new Uint8Array(138);
    mp3Header.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], 0);
    writeFileSync(mp3Path, mp3Header);

    await service.updateTrack(
      {
        title: 'Aces High',
        artist: 'Iron Maiden',
        performerInfo: 'Iron Maiden',
        album: 'Powerslave',
        year: '1984',
        genre: 'Heavy Metal',
        trackNumber: '01',
        unsynchronisedLyrics: { language: 'eng', text: 'There goes the siren' },
        userDefinedText: [
          { description: 'COUNTRY', value: 'United Kingdom' },
          { description: 'METAL_ARCHIVES_URL', value: 'https://www.metal-archives.com/albums/Iron_Maiden/Powerslave/74' },
        ],
      },
      mp3Path,
    );

    const readBack = service.getTags(mp3Path);
    expect(readBack).toEqual({
      title: 'Aces High',
      artist: 'Iron Maiden',
      performerInfo: 'Iron Maiden',
      album: 'Powerslave',
      year: '1984',
      genre: 'Heavy Metal',
      trackNumber: '01',
      unsynchronisedLyrics: { language: 'eng', text: 'There goes the siren' },
    });

    const mp3File = TagLibFile.createFromPath(mp3Path, undefined, ReadStyle.None);
    try {
      const id3v2 = mp3File.getTag(TagTypes.Id3v2, false) as Id3v2Tag;
      const txxx = id3v2.getFramesByClassType<Id3v2UserTextInformationFrame>(Id3v2FrameClassType.UserTextInformationFrame);
      expect(Id3v2UserTextInformationFrame.findUserTextInformationFrame(txxx, 'COUNTRY', false)?.text).toEqual(['United Kingdom']);
      expect(Id3v2UserTextInformationFrame.findUserTextInformationFrame(txxx, 'METAL_ARCHIVES_URL', false)?.text).toEqual([
        'https://www.metal-archives.com/albums/Iron_Maiden/Powerslave/74',
      ]);
    } finally {
      mp3File.dispose();
    }
  });
});
