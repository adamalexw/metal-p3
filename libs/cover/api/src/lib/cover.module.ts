import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { SharedMetalArchivesModule } from '@metal-p3/shared/metal-archives';
import { TrackModule } from '@metal-p3/track/api';
import { HttpModule } from '@nestjs/axios';
import { BASE_PATH_TOKEN } from '@metal-p3/api-interfaces';
import { DynamicModule, Module } from '@nestjs/common';
import { CoverController } from './cover.controller';
import { CoverService } from './cover.service';

@Module({
  imports: [HttpModule, TrackModule, SharedFileSystemModule, SharedMetalArchivesModule],
  controllers: [CoverController],
  providers: [CoverService],
})
export class CoverModule {
  static forRoot(basePath: string): DynamicModule {
    return {
      module: CoverModule,
      providers: [{ provide: BASE_PATH_TOKEN, useValue: basePath }],
    };
  }
}
