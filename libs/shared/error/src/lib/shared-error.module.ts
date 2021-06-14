import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedFeedbackModule } from '@metal-p3/shared/feedback';

@NgModule({
  imports: [CommonModule, SharedFeedbackModule],
})
export class SharedErrorModule {}
