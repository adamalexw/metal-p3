import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SharedNavToolbarModule } from '@metal-p3/shared/navigation';
import { UrlMatcherToolbarComponent } from './url-matcher-toolbar.component';

@NgModule({
  imports: [CommonModule, SharedNavToolbarModule, MatIconModule, MatProgressBarModule],
  declarations: [UrlMatcherToolbarComponent],
  exports: [UrlMatcherToolbarComponent],
})
export class UrlMatcherToolbarComponentModule {}
