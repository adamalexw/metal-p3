import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClientValidationError } from '@prisma/client/runtime';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: this.getErrorMessage(exception),
    });
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof PrismaClientValidationError) {
      return exception.message;
    }

    return JSON.stringify(exception);
  }
}
