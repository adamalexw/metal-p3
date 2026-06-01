import { TrackDto } from '@metal-p3/api-interfaces';
import { AdbService } from '@metal-p3/shared/adb';
import { FileSystemService } from '@metal-p3/shared/file-system';
import * as NodeID3 from 'node-id3';
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
