import { SharedDatabaseModule } from '@metal-p3/shared/database';
import { SharedMetalArchivesModule } from '@metal-p3/shared/metal-archives';
import { Module } from '@nestjs/common';
import { BandController } from './band.controller';
import { BandService } from './band.service';

@Module({
  imports: [SharedMetalArchivesModule, SharedDatabaseModule],
  controllers: [BandController],
  providers: [BandService],
  exports: [BandService],
})
export class BandModule {}
