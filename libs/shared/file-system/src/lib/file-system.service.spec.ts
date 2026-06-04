import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileSystemService } from './file-system.service';

describe('FileSystemService.hasExtraFiles', () => {
  let service: FileSystemService;
  let basePath: string;
  const folder = 'album';
  let albumPath: string;

  beforeEach(() => {
    service = new FileSystemService();
    basePath = mkdtempSync(join(tmpdir(), 'metal-p3-fs-'));
    albumPath = join(basePath, folder);
    require('fs').mkdirSync(albumPath, { recursive: true });
  });

  afterEach(() => {
    rmSync(basePath, { recursive: true, force: true });
  });

  it('returns false when the folder contains only mp3, cover and lrc files', () => {
    writeFileSync(join(albumPath, '01 - Track.mp3'), '');
    writeFileSync(join(albumPath, 'cover.jpg'), '');
    writeFileSync(join(albumPath, '01 - Track.lrc'), '[00:00.00] line');

    expect(service.hasExtraFiles(basePath, folder)).toBe(false);
  });

  it('returns true when an unsupported file type is present alongside an lrc', () => {
    writeFileSync(join(albumPath, '01 - Track.mp3'), '');
    writeFileSync(join(albumPath, '01 - Track.lrc'), '[00:00.00] line');
    writeFileSync(join(albumPath, 'notes.txt'), 'hi');

    expect(service.hasExtraFiles(basePath, folder)).toBe(true);
  });

  it('returns false when the folder is empty', () => {
    expect(service.hasExtraFiles(basePath, folder)).toBe(false);
  });

  it('returns false when the folder does not exist', () => {
    rmSync(albumPath, { recursive: true, force: true });
    expect(service.hasExtraFiles(basePath, folder)).toBe(false);
  });
});
