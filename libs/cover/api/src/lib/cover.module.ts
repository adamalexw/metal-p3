import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { TrackModule } from '@metal-p3/track/api';
import { HttpModule, Module } from '@nestjs/common';
import { CoverController } from './cover.controller';
import { CoverService } from './cover.service';

@Module({
  imports: [HttpModule, TrackModule, SharedFileSystemModule],
  controllers: [CoverController],
  providers: [CoverService],
})
export class CoverModule {}
