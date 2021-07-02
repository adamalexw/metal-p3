import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { PrismaClientValidationError } from '@prisma/client/runtime';

@Catch(PrismaClientValidationError)
export class DbExceptionsFilter implements ExceptionFilter {
  catch(exception: PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    Logger.error(exception);

    response.status(status).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception.message,
    });
  }
}
