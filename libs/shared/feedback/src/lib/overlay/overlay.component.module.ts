import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { OverlayComponent } from './overlay.component';
import { OverlayService } from './overlay.service';

@NgModule({
  imports: [CommonModule, OverlayModule, PortalModule, MatCardModule, MatButtonModule],
  declarations: [OverlayComponent],
  exports: [OverlayComponent],
  providers: [OverlayService],
})
export class OverlayComponentModule {}
