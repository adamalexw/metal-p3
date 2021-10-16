import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ConfirmDeleteComponentModule } from '@metal-p3/shared/feedback';
import { SharedNavToolbarModule } from '@metal-p3/shared/navigation';
import { UnmappedFoldersComponent } from './unmapped-folders.component';

@NgModule({
  imports: [CommonModule, SharedNavToolbarModule, ConfirmDeleteComponentModule, MatIconModule, MatListModule],
  declarations: [UnmappedFoldersComponent],
  exports: [UnmappedFoldersComponent],
})
export class UnmappedFoldersComponentModule {}
