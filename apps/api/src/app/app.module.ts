import { AlbumModule } from '@metal-p3/album/api';
import { BandModule } from '@metal-p3/band/api';
import { CoverModule } from '@metal-p3/cover/api';
import { MaintenanceApiModule } from '@metal-p3/maintenance/api';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { TrackModule } from '@metal-p3/track/api';
import { Module } from '@nestjs/common';
import { environment } from '../environments/environment.prod';

@Module({
  imports: [AlbumModule.forRoot(environment.basePath), BandModule, CoverModule, TrackModule, SharedFileSystemModule.forRoot(environment.basePath), MaintenanceApiModule],
})
export class AppModule {}
