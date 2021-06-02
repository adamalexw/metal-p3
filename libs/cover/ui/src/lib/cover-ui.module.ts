import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafePipeModule } from 'safe-pipe';
import { CoverDragDirective } from './cover-dnd.directive';
import { CoverComponent } from './cover/cover.component';

@NgModule({
  imports: [CommonModule, SafePipeModule, MatProgressSpinnerModule],
  declarations: [CoverComponent, CoverDragDirective],
  exports: [CoverComponent],
})
export class CoverUiModule {}
