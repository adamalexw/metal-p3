import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';

@Injectable()
export class FileSystemService {
  getFolders(folder: string): string[] {
    return fs.readdirSync(folder, {}) as string[];
  }

  getFiles(folder: string): string[] {
    return fs.readdirSync(folder, {}) as string[];
  }

  openFolder(folder: string): void {
    exec(`start "" "${folder}"`);
  }
}
