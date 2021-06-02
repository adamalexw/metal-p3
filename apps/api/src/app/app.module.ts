import { BandModule } from '@metal-p3/band/api';
import { CoverModule } from '@metal-p3/cover/api';
import { TrackModule } from '@metal-p3/track/api';
import { Module } from '@nestjs/common';
import { AlbumModule } from './album/album.module';

@Module({
  imports: [AlbumModule, BandModule, CoverModule, TrackModule],
})
export class AppModule {}
