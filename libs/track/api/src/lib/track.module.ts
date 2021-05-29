import { SharedAdbModule } from '@metal-p3/shared/adb';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { Module } from '@nestjs/common';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';

@Module({
  imports: [SharedFileSystemModule, SharedAdbModule],
  controllers: [TrackController],
  providers: [TrackService],
  exports: [TrackService],
})
export class TrackModule {}
