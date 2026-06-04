import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LrcLibService } from './lrclib.service';

@Module({
  imports: [HttpModule],
  providers: [LrcLibService],
  exports: [LrcLibService],
})
export class SharedLrcLibModule {}
