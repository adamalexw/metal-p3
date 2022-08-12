import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafePipeModule } from '@metal-p3/shared/safe-pipe';
import { CoverDragDirective } from './cover-dnd.directive';
import { CoverComponent } from './cover.component';

@NgModule({
  imports: [CommonModule, SafePipeModule, MatProgressSpinnerModule],
  declarations: [CoverComponent, CoverDragDirective],
  exports: [CoverComponent],
})
export class CoverComponentModule {}
