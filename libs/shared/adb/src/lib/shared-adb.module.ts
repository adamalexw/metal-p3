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
      module: SharedAdbModule,
      providers: [{ provide: 'ADB_PATH', useValue: adbPath }],
      exports: [{ provide: 'ADB_PATH', useValue: adbPath }],
    };
  }
}
