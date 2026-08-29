import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'fs';
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

describe('FileSystemService.renameWithRetry', () => {
  let service: FileSystemService;
  let basePath: string;

  beforeEach(() => {
    service = new FileSystemService();
    basePath = mkdtempSync(join(tmpdir(), 'metal-p3-fs-'));
  });

  afterEach(() => {
    rmSync(basePath, { recursive: true, force: true });
  });

  it('should rename the path when the rename succeeds', async () => {
    const src = join(basePath, 'a.mp3');
    const dest = join(basePath, 'b.mp3');
    writeFileSync(src, '');

    await service.renameWithRetry(src, dest, 3, 0);

    expect(existsSync(src)).toBe(false);
    expect(existsSync(dest)).toBe(true);
  });

  it('should throw once the attempts are exhausted and leave the source in place', async () => {
    const src = join(basePath, 'a.mp3');
    const dest = join(basePath, 'missing', 'a.mp3');
    writeFileSync(src, '');

    await expect(service.renameWithRetry(src, dest, 2, 0)).rejects.toThrow('after 2 attempts');

    expect(existsSync(src)).toBe(true);
  });
});

describe('FileSystemService.moveFilesToTheRoot', () => {
  let service: FileSystemService;
  let basePath: string;
  let albumPath: string;

  beforeEach(() => {
    service = new FileSystemService();
    basePath = mkdtempSync(join(tmpdir(), 'metal-p3-fs-'));
    albumPath = join(basePath, 'album');
    mkdirSync(join(albumPath, 'disc1'), { recursive: true });
  });

  afterEach(() => {
    rmSync(basePath, { recursive: true, force: true });
  });

  it('should move nested files to the root and remove the emptied sub-folder', async () => {
    writeFileSync(join(albumPath, 'disc1', '01 - Track.mp3'), '');
    writeFileSync(join(albumPath, 'disc1', 'cover.jpg'), '');

    await service.moveFilesToTheRoot(albumPath, albumPath, 3, 0);

    expect(readdirSync(albumPath).sort()).toEqual(['01 - Track.mp3', 'cover.jpg']);
  });

  it('should resolve immediately when there are no sub-folders', async () => {
    rmSync(join(albumPath, 'disc1'), { recursive: true, force: true });
    writeFileSync(join(albumPath, '01 - Track.mp3'), '');

    await expect(service.moveFilesToTheRoot(albumPath, albumPath, 3, 0)).resolves.toBeUndefined();

    expect(readdirSync(albumPath)).toEqual(['01 - Track.mp3']);
  });

  it('should throw when the files cannot be moved and leave them in place', async () => {
    writeFileSync(join(albumPath, 'disc1', '01 - Track.mp3'), '');

    await expect(service.moveFilesToTheRoot(albumPath, join(basePath, 'missing'), 2, 0)).rejects.toThrow('after 2 attempts');

    expect(existsSync(join(albumPath, 'disc1', '01 - Track.mp3'))).toBe(true);
  });
});
