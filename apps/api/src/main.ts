/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { AllExceptionsFilter } from './app/all-exceptions-handler';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT;

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port, () => {
    Logger.log('Listening at http://localhost:' + port + '/' + globalPrefix);
  });
}

bootstrap();
