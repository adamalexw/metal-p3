import { TrackDto } from '@metal-p3/api-interfaces';
import { AdbService } from '@metal-p3/shared/adb';
import { FileSystemService } from '@metal-p3/shared/file-system';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import * as NodeID3 from 'node-id3';
import { tmpdir } from 'os';
import { join } from 'path';
import { TrackService } from './track.service';

jest.mock('node-id3', () => ({
  Promise: {
    update: jest.fn().mockResolvedValue(true),
  },
  read: jest.fn(),
}));

describe('TrackService.saveTrack tag building', () => {
  let service: TrackService;
  let updateSpy: jest.Mock;

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
    updateSpy = (NodeID3.Promise.update as jest.Mock).mockClear().mockResolvedValue(true);
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
    (NodeID3.Promise.update as jest.Mock).mockClear().mockResolvedValue(true);
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
