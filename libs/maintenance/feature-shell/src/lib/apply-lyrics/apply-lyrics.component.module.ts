import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { ApplyLyricsComponentModule } from '@metal-p3/maintenance/ui';
import { ApplyLyricsShellComponent } from './apply-lyrics.component';

@NgModule({
  imports: [
    CommonModule,
    ApplyLyricsComponentModule,
    MatDialogModule,
    RouterModule.forChild([
      {
        path: '',
        component: ApplyLyricsShellComponent,
      },
    ]),
  ],
  declarations: [ApplyLyricsShellComponent],
  exports: [ApplyLyricsShellComponent],
})
export class ApplyLyricsShellComponentModule {}
