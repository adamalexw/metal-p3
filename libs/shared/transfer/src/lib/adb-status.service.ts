import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, merge, of, Subject, switchMap, timer } from 'rxjs';
import { AdbStatus, AdbService } from './adb.service';

const POLL_INTERVAL_MS = 30_000;

const DISCONNECTED: AdbStatus = { wifi: false, device: false };

@Injectable({ providedIn: 'root' })
export class AdbStatusService {
  private readonly adbService = inject(AdbService);

  private readonly refresh$ = new Subject<void>();

  private readonly status = signal<AdbStatus>(DISCONNECTED);

  readonly wifiConnected = computed(() => this.status().wifi);
  readonly deviceConnected = computed(() => this.status().device);
  readonly transferEnabled = computed(() => this.status().wifi && this.status().device);

  constructor() {
    merge(timer(0, POLL_INTERVAL_MS), this.refresh$)
      .pipe(
        switchMap(() => this.adbService.adbStatus().pipe(catchError(() => of(DISCONNECTED)))),
        takeUntilDestroyed(),
      )
      .subscribe((status) => this.status.set(status));
  }

  refresh() {
    this.refresh$.next();
  }
}
