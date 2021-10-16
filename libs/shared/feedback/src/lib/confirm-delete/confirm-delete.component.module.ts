import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { OverlayComponentModule } from '../overlay/overlay.component.module';
import { ConfirmDeleteComponent } from './confirm-delete.component';
import { ConfirmDeleteDirective } from './confirm-delete.directive';

@NgModule({
  imports: [CommonModule, MatCardModule, MatButtonModule, OverlayComponentModule],
  declarations: [ConfirmDeleteComponent, ConfirmDeleteDirective],
  exports: [ConfirmDeleteDirective],
})
export class ConfirmDeleteComponentModule {}
