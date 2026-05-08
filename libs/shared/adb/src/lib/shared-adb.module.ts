import { SharedFileSystemModule } from '@metal-p3/shared/file-system';
import { DynamicModule, Module } from '@nestjs/common';
import { AdbController } from './adb.controller';
import { AdbService } from './adb.service';

@Module({
  imports: [SharedFileSystemModule],
  controllers: [AdbController],
  providers: [AdbService],
  exports: [AdbService],
})
export class SharedAdbModule {
  static forRoot(adbPath: string): DynamicModule {
    return {
      global: true,
      module: SharedAdbModule,
      imports: [SharedFileSystemModule],
      controllers: [AdbController],
      providers: [{ provide: 'ADB_PATH', useValue: adbPath }, AdbService],
      exports: [AdbService, 'ADB_PATH'],
    };
  }
}
