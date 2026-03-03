import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { Module } from '@nestjs/common';
import { AdbService } from './adb.service';
import { AdbController } from './adb.controller';

@Module({
  imports: [SharedFileSystemModule],
  controllers: [AdbController],
  providers: [AdbService],
  exports: [AdbService],
})
export class SharedAdbModule {}
