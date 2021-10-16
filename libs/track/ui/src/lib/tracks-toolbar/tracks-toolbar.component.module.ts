import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TimePipeModule } from '@metal-p3/track/util';
import { TracksToolbarComponent } from './tracks-toolbar.component';

@NgModule({
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, TimePipeModule],
  declarations: [TracksToolbarComponent],
  exports: [TracksToolbarComponent],
})
export class TracksToolbarComponentModule {}
