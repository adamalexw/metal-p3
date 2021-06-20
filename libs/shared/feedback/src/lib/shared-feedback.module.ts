import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmDeleteDirective } from './confirm-delete.directive';
import { ConfirmDeleteComponent } from './confirm-delete/confirm-delete.component';
import { OverlayComponent } from './overlay/overlay.component';

const materialModules = [MatButtonModule, OverlayModule, MatSnackBarModule, MatIconModule, MatCardModule];

@NgModule({
  imports: [CommonModule, materialModules],
  declarations: [OverlayComponent, ConfirmDeleteComponent, ConfirmDeleteDirective],
  exports: [ConfirmDeleteDirective],
})
export class SharedFeedbackModule {}
