import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';

import { Prisma } from '@metal-p3/prisma/client';

@Catch(Prisma.PrismaClientValidationError, Prisma.PrismaClientKnownRequestError)
export class DbExceptionsFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientValidationError | Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    Logger.error(exception);

    const isTimeout = exception instanceof Prisma.PrismaClientKnownRequestError && (exception.code === 'P1008' || exception.code === 'P2024');
    const status = isTimeout ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception.message,
    });
  }
}
