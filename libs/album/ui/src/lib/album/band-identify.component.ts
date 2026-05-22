import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BandDto } from '@metal-p3/api-interfaces';
import { BandService } from '@metal-p3/band/data-access';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatListModule, MatProgressBarModule],
  selector: 'app-band-identify',
  templateUrl: './band-identify.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandIdentifyComponent implements OnInit {
  private readonly bandService = inject(BandService);
  private readonly dialogRef = inject(MatDialogRef<BandIdentifyComponent>);
  private readonly destroyRef = inject(DestroyRef);

  readonly data: { name: string } = inject(MAT_DIALOG_DATA);

  readonly bands = signal<BandDto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.bandService
      .getBands(this.data.name)
      .pipe(
        tap((bands) => {
          this.bands.set(bands);
          this.loading.set(false);
        }),
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  select(band: BandDto): void {
    this.dialogRef.close(band);
  }
}
