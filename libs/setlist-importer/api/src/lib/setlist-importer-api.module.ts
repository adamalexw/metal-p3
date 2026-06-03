import { BASE_PATH_TOKEN } from '@metal-p3/api-interfaces';
import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { HttpModule } from '@nestjs/axios';
import { DynamicModule, Module } from '@nestjs/common';
import { SetlistImporterController } from './setlist-importer.controller';
import { SetlistImporterService } from './setlist-importer.service';

@Module({
  imports: [HttpModule, SharedDatabaseModule, SharedFileSystemModule],
  controllers: [SetlistImporterController],
  providers: [SetlistImporterService],
  exports: [],
})
export class SetlistImporterApiModule {
  static forRoot(basePath: string): DynamicModule {
    return {
      module: SetlistImporterApiModule,
      providers: [{ provide: BASE_PATH_TOKEN, useValue: basePath }],
      exports: [{ provide: BASE_PATH_TOKEN, useValue: basePath }],
    };
  }
}
