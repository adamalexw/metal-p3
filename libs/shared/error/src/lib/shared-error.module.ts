import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NotificationModule } from '@metal-p3/shared/feedback';

@NgModule({
  imports: [CommonModule, NotificationModule],
})
export class SharedErrorModule {}
