import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MetalArchivesService } from './metal-archives.service';

@Module({
  imports: [HttpModule],
  providers: [MetalArchivesService],
  exports: [MetalArchivesService],
})
export class SharedMetalArchivesModule {}
