import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SharedNavToolbarModule } from '@metal-p3/shared/navigation';
import { ExtraFilesToolbarComponent } from './extra-files-toolbar.component';

@NgModule({
  imports: [CommonModule, SharedNavToolbarModule, MatIconModule, MatProgressBarModule],
  declarations: [ExtraFilesToolbarComponent],
  exports: [ExtraFilesToolbarComponent],
})
export class ExtraFilesToolbarComponentModule {}
