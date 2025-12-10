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
    try {
      if (retry >= 3) {
        return;
      }
      renameSync(path, newPath);
    } catch (error) {
      if (retry == 0) {
        this.setReadAndWritePermission(path);
      }
      Logger.error(`Rename file ${path} - ${newPath}`, error);
      setTimeout(() => this.rename(path, newPath, retry + 1), 3000);
    }
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

  moveFilesToTheRoot(folder: string, rootFolder: string, retry = 0) {
    if (retry >= 3) {
      return;
    }

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

        if (this.getFiles(itemPath).length > 0) {
          setTimeout(() => {
            this.moveFilesToTheRoot(folder, rootFolder, retry + 1);
          }, 3000);
        } else {
          this.cleanEmptyFolders(folder);
        }
      }
    }
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
    const files = this.getFiles(join(basePath, folder));

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      if (extname(file) !== '.mp3') {
        if (this.isFolder(join(basePath, folder, file))) {
          return true;
        }

        if (file.toLowerCase() !== 'cover.jpg') {
          return true;
        }
      }
    }

    return false;
  }
}
