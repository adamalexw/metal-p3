import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showError(message: string, action?: string | undefined) {
    this.snackBar.open(message, action, { panelClass: 'snackbar-error' });
  }

  showComplete(message: string, action?: string | undefined) {
    this.snackBar.open(message, action, { duration: 2000, panelClass: 'snackbar-info' });
  }

  showProgress(message: string, action?: string | undefined): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action);
  }

  showInfo(message: string, action?: string | undefined) {
    this.snackBar.open(message, action, { duration: 2000, panelClass: 'snackbar-info' });
  }
}
