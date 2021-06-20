import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { chmodSync, lstatSync, readdirSync, renameSync, rmdirSync, statSync, unlinkSync } from 'fs';
import { basename, dirname, join } from 'path';

@Injectable()
export class FileSystemService {
  getFolders(folder: string): string[] {
    return readdirSync(folder, {}) as string[];
  }

  getFiles(folder: string): string[] {
    return readdirSync(folder, {}) as string[];
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

  rename(path: string, newPath: string) {
    try {
      renameSync(path, newPath);
    } catch (error) {
      this.setReadAndWritePermission(path);
      renameSync(path, newPath);
    }
  }

  deleteFile(path: string) {
    unlinkSync(path);
  }

  deleteFolder(path: string) {
    rmdirSync(path, { recursive: true });
  }

  filenameValidator(filename: string): string {
    return filename
      .replace(/\n/g, ' ')
      .replace(/[<>:"/\\|?*\x00-\x1F]| +$/g, '')
      .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/, (x) => x + '_');
  }

  getFileStats(file: string) {
    return statSync(file);
  }

  setReadAndWritePermission(file: string) {
    chmodSync(file, this.getFileStats(file).mode | 0o666);
  }

  moveFilesToTheRoot(folder: string, rootFolder: string) {
    const folders = this.getFiles(folder);

    for (let index = 0; index < folders.length; index++) {
      const item = folders[index];
      const itemPath = join(folder, item);

      if (this.isFolder(itemPath)) {
        const files = this.getFiles(itemPath);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          this.rename(join(itemPath, file), join(rootFolder, file));
        }

        this.cleanEmptyFolders(folder);
      }
    }
  }

  cleanEmptyFolders(folder: string) {
    const isDir = this.isFolder(folder);
    if (!isDir) {
      return;
    }

    let files = this.getFiles(folder);
    if (files.length > 0) {
      files.forEach((file) => {
        const fullPath = join(folder, file);
        this.cleanEmptyFolders(fullPath);
      });

      files = this.getFiles(folder);
    }

    if (files.length == 0) {
      rmdirSync(folder);
      return;
    }
  }
}
