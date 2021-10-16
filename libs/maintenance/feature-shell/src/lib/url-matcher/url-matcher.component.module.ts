import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UrlMatcherComponentModule, UrlMatcherToolbarComponentModule } from '@metal-p3/maintenance/ui';
import { UrlMatcherShellComponent } from './url-matcher.component';

@NgModule({
  imports: [
    CommonModule,
    UrlMatcherToolbarComponentModule,
    UrlMatcherComponentModule,
    RouterModule.forChild([
      {
        path: '',
        component: UrlMatcherShellComponent,
      },
    ]),
  ],
  declarations: [UrlMatcherShellComponent],
  exports: [UrlMatcherShellComponent],
})
export class UrlMatcherShellComponentModule {}
