import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  getError(error: Error | HttpErrorResponse) {
    return error instanceof HttpErrorResponse ? this.getServerErrorMessage(error) : this.getClientErrorMessage(error);
  }

  getClientErrorMessage(error: Error): string {
    return error.message ? error.message : error.toString();
  }

  getServerErrorMessage(error: HttpErrorResponse): string {
    if (!navigator.onLine) {
      return 'No Internet Connection';
    } else if (error.error) {
      if (error.error.errorMessage) {
        return error.error.errorMessage;
      }

      return JSON.stringify(error.error);
    } else {
      return error.message;
    }
  }
}
