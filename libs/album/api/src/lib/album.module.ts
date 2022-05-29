import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { SharedMetalArchivesModule } from '@metal-p3/shared/metal-archives';
import { TrackModule } from '@metal-p3/track/api';
import { DynamicModule, Module } from '@nestjs/common';
import { AlbumGateway } from './album-gateway.service';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';

@Module({
  imports: [TrackModule, SharedDatabaseModule, SharedFileSystemModule, SharedMetalArchivesModule],
  controllers: [AlbumController],
  providers: [AlbumService, AlbumGateway],
  exports: [AlbumService],
})
export class AlbumModule {
  static forRoot(basePath: string, take: number): DynamicModule {
    return {
      module: AlbumModule,
      providers: [
        { provide: 'BASE_PATH', useValue: basePath },
        { provide: 'TAKE', useValue: take },
      ],
      exports: [{ provide: 'BASE_PATH', useValue: basePath }],
    };
  }
}
