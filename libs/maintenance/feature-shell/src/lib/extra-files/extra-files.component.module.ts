import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ExtraFilesComponentModule, ExtraFilesToolbarComponentModule } from '@metal-p3/maintenance/ui';
import { ExtraFilesShellComponent } from './extra-files.component';

@NgModule({
  imports: [
    CommonModule,
    ExtraFilesToolbarComponentModule,
    ExtraFilesComponentModule,
    RouterModule.forChild([
      {
        path: '',
        component: ExtraFilesShellComponent,
      },
    ]),
  ],
  declarations: [ExtraFilesShellComponent],
  exports: [ExtraFilesShellComponent],
})
export class ExtraFilesShellComponentModule {}
