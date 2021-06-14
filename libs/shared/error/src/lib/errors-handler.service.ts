import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { NotificationService } from '@metal-p3/shared/feedback';
//import { LoggerService } from '@shared/util-logging';
import { ErrorService } from './error.service';

@Injectable({ providedIn: 'root' })
export class ErrorsHandler implements ErrorHandler {
  // Can not use dependency injection because error handling is loaded first, have to use injector to get access to those dependencies
  constructor(private injector: Injector) {}

  handleError(error: Error | HttpErrorResponse) {
    console.error(error);

    const errorService = this.injector.get(ErrorService);
    // const logger = this.injector.get(LoggerService);
    const notifier = this.injector.get(NotificationService);

    let message: string;

    if (error instanceof HttpErrorResponse) {
      // Server Error
      message = errorService.getServerErrorMessage(error);
      // logger.logHttpError(error);
    } else {
      // Client Error
      message = errorService.getClientErrorMessage(error);
      // logger.logError(error);
    }

    notifier.showError(message);
  }
}
