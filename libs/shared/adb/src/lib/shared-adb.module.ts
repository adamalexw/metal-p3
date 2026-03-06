import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { Module } from '@nestjs/common';
import { AdbController } from './adb.controller';
import { AdbService } from './adb.service';

@Module({
  imports: [SharedFileSystemModule],
  controllers: [AdbController],
  providers: [AdbService],
  exports: [AdbService],
})
export class SharedAdbModule {}
