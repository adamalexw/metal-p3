import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ConnectPhoneComponent } from './connect-phone/connect-phone.component';

@Injectable({ providedIn: 'root' })
export class ConnectPhoneService {
  private readonly snackBar = inject(MatSnackBar);

  private snackBarRef: MatSnackBarRef<ConnectPhoneComponent> | null = null;

  showConnectPhone() {
    this.snackBarRef = this.snackBar.openFromComponent(ConnectPhoneComponent, { verticalPosition: 'top', horizontalPosition: 'center', panelClass: 'snackbar-theme' });

    this.snackBarRef.afterDismissed().subscribe(() => {
      this.snackBarRef = null;
    });
  }

  closeConnectPhone() {
    this.snackBarRef?.dismiss();
  }
}
