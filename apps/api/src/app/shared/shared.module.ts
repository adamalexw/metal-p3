import { HttpModule, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { FileSystemService } from './file-system.service';
import { MetalArchivesService } from './metal-archives.service';
import { PrismaService } from './prisma.service';

@Module({
  imports: [HttpModule],
  providers: [FileSystemService, MetalArchivesService, PrismaService, DbService],
  exports: [FileSystemService, MetalArchivesService, DbService],
})
export class SharedModule {}
