import { BASE_PATH_TOKEN } from '@metal-p3/api-interfaces';
import { DynamicModule, Module } from '@nestjs/common';
import { FileSystemService } from './file-system.service';

@Module({
  providers: [FileSystemService],
  exports: [FileSystemService],
})
export class SharedFileSystemModule {
  static forRoot(basePath: string): DynamicModule {
    return {
      module: SharedFileSystemModule,
      providers: [{ provide: BASE_PATH_TOKEN, useValue: basePath }],
      exports: [{ provide: BASE_PATH_TOKEN, useValue: basePath }],
    };
  }
}
