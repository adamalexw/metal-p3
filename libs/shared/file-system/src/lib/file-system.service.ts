import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { chmodSync, existsSync, lstatSync, readdirSync, renameSync, rmSync, statSync, unlinkSync } from 'fs';
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
    rmSync(path, { recursive: true });
  }

  filenameValidator(filename: string): string {
    return (
      filename
        .replace(/\n/g, ' ')
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1F]| +$/g, '')
        .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/, (x) => x + '_')
    );
  }

  getFileStats(file: string) {
    return statSync(file);
  }

  setReadAndWritePermission(file: string) {
    chmodSync(file, this.getFileStats(file).mode | 0o666);
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
          }, 1000);
        } else {
          this.cleanEmptyFolders(folder);
        }
      }
    }
  }

  cleanEmptyFolders(folder: string) {
    try {
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
        rmSync(folder, { force: true });
        return;
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
