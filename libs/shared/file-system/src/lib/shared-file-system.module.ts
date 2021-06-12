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
      providers: [{ provide: 'BASE_PATH', useValue: basePath }],
      exports: [{ provide: 'BASE_PATH', useValue: basePath }],
    };
  }
}
