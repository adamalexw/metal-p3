import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showError(message: string, action?: string | undefined) {
    this.snackBar.open(message, action, {});
  }

  showComplete(message: string, action?: string | undefined) {
    this.snackBar.open(message, action, { duration: 300 });
  }
}
