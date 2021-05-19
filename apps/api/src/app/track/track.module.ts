import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';

@Module({
  imports: [SharedModule],
  controllers: [TrackController],
  providers: [TrackService],
  exports: [TrackService],
})
export class TrackModule {}
