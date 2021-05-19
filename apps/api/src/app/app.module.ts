import { Module } from '@nestjs/common';
import { AlbumModule } from './album/album.module';
import { BandModule } from './band/band.module';
import { CoverModule } from './cover/cover.module';

@Module({
  imports: [AlbumModule, BandModule, CoverModule],
})
export class AppModule {}
