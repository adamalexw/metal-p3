import { AlbumModule } from '@metal-p3/album/api';
import { BandModule } from '@metal-p3/band/api';
import { CoverModule } from '@metal-p3/cover/api';
import { MaintenanceApiModule } from '@metal-p3/maintenance/api';
import { PlaylistApiModule } from '@metal-p3/playlist/api';
import { SetlistImporterApiModule } from '@metal-p3/setlist-importer/api';
import { SharedAdbModule } from '@metal-p3/shared/adb';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { TrackModule } from '@metal-p3/track/api';
import { Module } from '@nestjs/common';
import { environment } from '../environments/environment.prod';

@Module({
  imports: [
    SharedAdbModule,
    AlbumModule.forRoot(environment.basePath, environment.take),
    BandModule,
    CoverModule.forRoot(environment.basePath),
    TrackModule.forRoot(),
    SharedFileSystemModule.forRoot(environment.basePath),
    MaintenanceApiModule.forRoot(environment.basePath),
    PlaylistApiModule,
    SetlistImporterApiModule.forRoot(environment.basePath),
  ],
})
export class AppModule {}
