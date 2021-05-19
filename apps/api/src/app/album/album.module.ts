import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { TrackModule } from '../track/track.module';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';

@Module({
  imports: [SharedModule, TrackModule],
  controllers: [AlbumController],
  providers: [AlbumService],
  exports: [AlbumService],
})
export class AlbumModule {}
