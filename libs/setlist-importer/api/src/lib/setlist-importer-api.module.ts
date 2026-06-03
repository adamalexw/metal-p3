import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { SetlistImporterController } from './setlist-importer.controller';
import { SetlistImporterService } from './setlist-importer.service';

@Module({
  imports: [HttpModule, SharedDatabaseModule, SharedFileSystemModule],
  controllers: [SetlistImporterController],
  providers: [SetlistImporterService],
  exports: [],
})
export class SetlistImporterApiModule {}
