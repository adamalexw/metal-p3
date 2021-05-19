import { HttpModule, Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { TrackModule } from '../track/track.module';
import { CoverController } from './cover.controller';
import { CoverService } from './cover.service';

@Module({
  imports: [HttpModule, TrackModule, SharedModule],
  controllers: [CoverController],
  providers: [CoverService],
})
export class CoverModule {}
