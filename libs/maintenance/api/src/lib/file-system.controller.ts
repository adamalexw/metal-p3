import { Controller, Delete, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileSystemMaintenanceService } from './file-system.service';

@Controller('maintenance/file-system')
export class FileSystemController {
  constructor(private readonly service: FileSystemMaintenanceService) {}

  @Get('unmappedFolders')
  getUnmappedFolders(): Observable<string[]> {
    return this.service.getUnmappedFolders();
  }

  @Get('missingFolders')
  getMissingFolders(): Observable<string[]> {
    return this.service.getMissingFolders();
  }

  @Delete('folder')
  deleteFolder(@Query('folder') folder: string) {
    this.service.deleteFolder(folder);
  }

  @Get('extraFiles')
  getExtraFiles(): void {
    this.service.extraFiles();
  }

  @Get('cancel')
  cancelExtraFiles(): void {
    this.service.cancelExtraFiles();
  }
}
