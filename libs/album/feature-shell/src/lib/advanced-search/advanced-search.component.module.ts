import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AdvancedSearchFormComponentModule } from '@metal-p3/album/ui';
import { AdvancedSearchShellComponent } from './advanced-search.component';

@NgModule({
  imports: [CommonModule, AdvancedSearchFormComponentModule],
  declarations: [AdvancedSearchShellComponent],
  exports: [AdvancedSearchShellComponent],
})
export class AdvancedSearchShellComponentModule {}
