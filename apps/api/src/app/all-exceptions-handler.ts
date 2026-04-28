import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // WebSocket and RPC contexts have no HTTP response — skip HTTP handling
    if (host.getType() !== 'http') {
      this.logger.error('Unhandled non-HTTP exception', exception instanceof Error ? exception.stack : JSON.stringify(exception));
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const request = ctx.getRequest<{ url: string }>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorMessage = this.getErrorMessage(exception);

    this.logger.error(`${request.url} → ${status}: ${errorMessage}`, exception instanceof Error ? exception.stack : undefined);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorMessage,
    });
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      return typeof res === 'string' ? res : JSON.stringify(res);
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return JSON.stringify(exception);
  }
}
