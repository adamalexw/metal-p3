import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { SharedMetalArchivesModule } from '@metal-p3/shared/metal-archives';
import { TrackModule } from '@metal-p3/track/api';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoverController } from './cover.controller';
import { CoverService } from './cover.service';

@Module({
  imports: [HttpModule, TrackModule, SharedFileSystemModule, SharedMetalArchivesModule],
  controllers: [CoverController],
  providers: [CoverService],
})
export class CoverModule {}
