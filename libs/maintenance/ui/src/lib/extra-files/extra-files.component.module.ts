import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ExtraFilesComponent } from './extra-files.component';

@NgModule({
  imports: [CommonModule, MatListModule, MatIconModule],
  declarations: [ExtraFilesComponent],
  exports: [ExtraFilesComponent],
})
export class ExtraFilesComponentModule {}
