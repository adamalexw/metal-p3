import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

@Module({
  imports: [SharedDatabaseModule],
  controllers: [PlaylistController],
  providers: [PlaylistService],
  exports: [],
})
export class PlaylistApiModule {}
