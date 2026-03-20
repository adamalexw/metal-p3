import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationService } from '@metal-p3/shared/feedback';
import { AdbService } from '../adb.service';

@Component({
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  selector: 'app-connect-phone',
  templateUrl: './connect-phone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdbService],
})
export class ConnectPhoneComponent {
  private readonly adbService = inject(AdbService);
  private readonly notificationService = inject(NotificationService);
  snackBarRef = inject(MatSnackBarRef);

  host = '192.168.86.20';
  port = 0;
  code = '';

  pairPhone() {
    this.adbService.pairPhone(this.host, this.port, this.code).subscribe({
      next: () => (this.code = ''),
      error: (err) => this.notificationService.showError(`Failed to pair phone: ${err}`, 'Pair Phone'),
    });
  }

  connectPhone() {
    this.adbService.connectPhone(this.host, this.port).subscribe({
      next: () => this.snackBarRef.dismissWithAction(),
      error: (err) => this.notificationService.showError(`Failed to connect phone: ${err}`, 'Connect Phone'),
    });
  }

  cancel() {
    this.snackBarRef.dismiss();
  }
}
