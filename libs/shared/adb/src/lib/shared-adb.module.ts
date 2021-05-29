import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { Module } from '@nestjs/common';
import { AdbService } from './adb.service';

@Module({
  imports: [SharedFileSystemModule],
  providers: [AdbService],
  exports: [AdbService],
})
export class SharedAdbModule {}
