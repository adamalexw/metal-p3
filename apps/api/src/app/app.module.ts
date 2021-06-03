import { AlbumModule } from '@metal-p3/album/api';
import { BandModule } from '@metal-p3/band/api';
import { CoverModule } from '@metal-p3/cover/api';
import { TrackModule } from '@metal-p3/track/api';
import { Module } from '@nestjs/common';
import { environment } from '../environments/environment.prod';

@Module({
  imports: [AlbumModule.forRoot(environment.basePath), BandModule, CoverModule, TrackModule],
})
export class AppModule {}
