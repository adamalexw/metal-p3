import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PrismaClient } from '@metal-p3/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
