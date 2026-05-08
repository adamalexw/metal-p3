import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { DynamicModule, Module } from '@nestjs/common';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';

@Module({
  imports: [SharedFileSystemModule],
  controllers: [TrackController],
  providers: [TrackService],
  exports: [TrackService],
})
export class TrackModule {
  static forRoot(): DynamicModule {
    return {
      module: TrackModule,
      imports: [SharedFileSystemModule],
    };
  }
}
