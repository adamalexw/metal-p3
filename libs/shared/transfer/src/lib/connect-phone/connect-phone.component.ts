import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { NotificationService } from '@metal-p3/shared/feedback';
import { AdbService } from '../adb.service';

type ConnectPhoneModel = {
  host: string;
  port: number | null;
  code: string;
};

@Component({
  imports: [A11yModule, FormField, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  selector: 'app-connect-phone',
  templateUrl: './connect-phone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdbService],
})
export class ConnectPhoneComponent implements OnInit {
  private readonly adbService = inject(AdbService);
  private readonly notificationService = inject(NotificationService);
  snackBarRef = inject(MatSnackBarRef);

  protected readonly model = signal<ConnectPhoneModel>({
    host: '192.168.86.20',
    port: null,
    code: '',
  });

  protected readonly connectForm = form(this.model);
  protected readonly isWifi = signal<boolean | null>(null);

  ngOnInit() {
    this.adbService.isWifiConnected().subscribe((connected) => this.isWifi.set(connected));
  }

  pairPhone() {
    const { host, port, code } = this.model();
    this.adbService.pairPhone(host, port, code).subscribe({
      next: () => this.model.update((m) => ({ ...m, code: '' })),
      error: (err) => this.notificationService.showError(`Failed to pair phone: ${err}`, 'Pair Phone'),
    });
  }

  connectPhone() {
    const { host, port } = this.model();
    this.adbService.connectPhone(host, port).subscribe({
      next: () => this.snackBarRef.dismissWithAction(),
      error: (err) => this.notificationService.showError(`Failed to connect phone: ${err}`, 'Connect Phone'),
    });
  }

  cancel() {
    this.snackBarRef.dismiss();
  }
}
