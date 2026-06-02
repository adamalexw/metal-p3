import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMssql } from '@prisma/adapter-mssql';

import { PrismaClient } from '@metal-p3/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env['DATABASE_URL'];

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Increase mssql driver request timeout (default is 15 000 ms which is too
    // short for slow or first-run queries against a local SQL Server instance).
    const connectionStringWithTimeout = connectionString.includes('requestTimeout') ? connectionString : `${connectionString};requestTimeout=60000`;

    const adapter = new PrismaMssql(connectionStringWithTimeout);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
