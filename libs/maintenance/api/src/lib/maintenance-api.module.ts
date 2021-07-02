import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { SharedMetalArchivesModule } from '@metal-p3/shared/metal-archives';
import { Module } from '@nestjs/common';
import { LyricsController } from './lyrics.controller';
import { LyricsService } from './lyrics.service';
import { MaintenanceGateway } from './maintenance-gateway.service';

@Module({
  imports: [SharedDatabaseModule, SharedFileSystemModule, SharedMetalArchivesModule],
  controllers: [LyricsController],
  providers: [LyricsService, MaintenanceGateway],
  exports: [],
})
export class MaintenanceApiModule {}
