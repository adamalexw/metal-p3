import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { SharedMetalArchivesModule } from '@metal-p3/shared/metal-archives';
import { DynamicModule, Module } from '@nestjs/common';
import { FileSystemController } from './file-system.controller';
import { FileSystemMaintenanceService } from './file-system.service';
import { LyricsController } from './lyrics.controller';
import { LyricsService } from './lyrics.service';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Module({
  imports: [SharedDatabaseModule, SharedFileSystemModule, SharedMetalArchivesModule],
  controllers: [LyricsController, FileSystemController],
  providers: [LyricsService, MaintenanceGateway, FileSystemMaintenanceService],
  exports: [FileSystemMaintenanceService],
})
export class MaintenanceApiModule {
  static forRoot(basePath: string): DynamicModule {
    return {
      module: MaintenanceApiModule,
      providers: [{ provide: 'BASE_PATH', useValue: basePath }],
      exports: [{ provide: 'BASE_PATH', useValue: basePath }],
    };
  }
}
