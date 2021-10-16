import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UnmappedFoldersComponentModule } from '@metal-p3/maintenance/ui';
import { UnmappedFoldersShellComponent } from './unmapped-folders.component';

@NgModule({
  imports: [
    CommonModule,
    UnmappedFoldersComponentModule,
    RouterModule.forChild([
      {
        path: '',
        component: UnmappedFoldersShellComponent,
      },
    ]),
  ],
  declarations: [UnmappedFoldersShellComponent],
  exports: [UnmappedFoldersShellComponent],
})
export class UnmappedFoldersShellComponentModule {}
