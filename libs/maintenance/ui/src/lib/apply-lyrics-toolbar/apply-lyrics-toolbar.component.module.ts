import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CoverComponentModule } from '@metal-p3/cover/ui';
import { SharedNavToolbarModule } from '@metal-p3/shared/navigation';
import { ApplyLyricsToolbarComponent } from './apply-lyrics-toolbar.component';

@NgModule({
  imports: [CommonModule, RouterModule, SharedNavToolbarModule, CoverComponentModule, MatIconModule],
  declarations: [ApplyLyricsToolbarComponent],
  exports: [ApplyLyricsToolbarComponent],
})
export class ApplyLyricsToolbarComponentModule {}
