import { HttpModule, Module } from '@nestjs/common';
import { MetalArchivesService } from './metal-archives.service';

@Module({
  imports: [HttpModule],
  providers: [MetalArchivesService],
  exports: [MetalArchivesService],
})
export class SharedMetalArchivesModule {}
