import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { BandController } from './band.controller';
import { BandService } from './band.service';

@Module({
  imports: [SharedModule],
  controllers: [BandController],
  providers: [BandService],
  exports: [BandService],
})
export class BandModule {}
