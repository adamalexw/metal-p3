import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { chmodSync, existsSync, lstatSync, readdirSync, renameSync, rmdirSync, rmSync, statSync, unlinkSync } from 'fs';
import { basename, dirname, extname, join } from 'path';

@Injectable()
export class FileSystemService {
  getFolders(folder: string): string[] {
    if (existsSync(folder)) {
      return readdirSync(folder, {}) as string[];
    }

    throw new BadRequestException("Folder doesn't exist", `${folder} doesn't exist`);
  }

  getFiles(folder: string): string[] {
    if (existsSync(folder)) {
      return readdirSync(folder, {}) as string[];
    }

    throw new BadRequestException("Folder doesn't exist", `${folder} doesn't exist`);
  }

  openFolder(folder: string): void {
    exec(`start "" "${folder}"`);
  }

  isFolder(path: string) {
    return lstatSync(path).isDirectory();
  }

  getParentFoler(file: string) {
    return basename(dirname(file));
  }

  getFilename(file: string) {
    return basename(file);
  }

  rename(path: string, newPath: string, retry = 0) {
    if (retry >= 3) {
      return;
    }

    if (!this.tryRename(path, newPath, retry + 1)) {
      setTimeout(() => this.rename(path, newPath, retry + 1), 3000);
    }
  }

  async renameWithRetry(path: string, newPath: string, attempts = 3, delayMs = 3000): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      if (this.tryRename(path, newPath, attempt)) {
        return;
      }

      if (attempt < attempts) {
        await this.delay(delayMs);
      }
    }

    throw new Error(`Failed to rename ${path} to ${newPath} after ${attempts} attempts`);
  }

  private tryRename(path: string, newPath: string, attempt: number): boolean {
    try {
      renameSync(path, newPath);
      return true;
    } catch (error) {
      if (attempt === 1) {
        this.setReadAndWritePermission(path);
      }
      Logger.error(`Rename file ${path} - ${newPath} (attempt ${attempt})`, error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  deleteFile(path: string) {
    unlinkSync(path);
  }

  deleteFolder(path: string) {
    rmSync(path, { recursive: true });
  }

  filenameValidator(filename: string): string {
    let newName = filename
      .replace(/\n/g, ' ')
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]| +$/g, '')
      .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/, (x) => x + '_')
      .trim();

    if (newName.startsWith('.')) {
      newName = newName.substring(0);
      return this.filenameValidator(newName);
    }

    if (newName.endsWith('.')) {
      newName = newName.slice(0, -1);
      return this.filenameValidator(newName);
    }

    return newName;
  }

  getFileStats(file: string) {
    return statSync(file);
  }

  setReadAndWritePermission(file: string) {
    try {
      chmodSync(file, this.getFileStats(file).mode | 0o666);
    } catch (error) {
      Logger.error(`Failed to set permissions for ${file}`, error);
    }
  }

  async moveFilesToTheRoot(folder: string, rootFolder: string, attempts = 3, delayMs = 3000): Promise<void> {
    let failedAttempts = 0;

    while (failedAttempts < attempts) {
      const subFolders = this.getFiles(folder)
        .map((item) => join(folder, item))
        .filter((itemPath) => this.isFolder(itemPath));

      if (!subFolders.length) {
        return;
      }

      const moves = subFolders.flatMap((subFolder) => this.getFiles(subFolder).map((file) => ({ from: join(subFolder, file), to: join(rootFolder, file) })));

      if (!moves.length) {
        this.cleanEmptyFolders(folder);
        return;
      }

      let moved = 0;
      for (const { from, to } of moves) {
        if (this.tryRename(from, to, failedAttempts + 1)) {
          moved++;
        }
      }

      this.cleanEmptyFolders(folder);

      if (moved === 0) {
        failedAttempts++;

        if (failedAttempts < attempts) {
          await this.delay(delayMs);
        }
      }
    }

    throw new Error(`Failed to move files to the root of ${rootFolder} after ${attempts} attempts`);
  }

  cleanEmptyFolders(folder: string) {
    try {
      if (!this.isFolder(folder)) {
        return;
      }

      const files = this.getFiles(folder);

      if (files.length == 0) {
        rmdirSync(folder, { maxRetries: 3, retryDelay: 500 });
        return;
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = join(folder, files[i]);
          if (this.isFolder(file)) {
            this.cleanEmptyFolders(file);
          }
        }
      }
    } catch (error) {
      Logger.error(error);
    }
  }

  hasExtraFiles(basePath: string, folder: string): boolean {
    const coverPattern = /^cover\.jpe?g$/i;
    const coverExt = /\.jpe?g$/i;
    const fullPath = join(basePath, folder);
    if (!existsSync(fullPath)) return false;
    return this.getFiles(fullPath).some((file) => {
      const ext = extname(file).toLowerCase();
      if (ext === '.mp3') return false;
      if (ext === '.lrc') return false;
      if (coverPattern.test(file)) return false;
      // Treat non-ASCII jpeg filenames (e.g. Сover.jpg with Cyrillic С) as cover variants, not extra files
      // eslint-disable-next-line no-control-regex
      if (/[^\x00-\x7F]/.test(file) && coverExt.test(file)) return false;
      return true;
    });
  }
}
