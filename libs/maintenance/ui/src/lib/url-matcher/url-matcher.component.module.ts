import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { UrlMatcherComponent } from './url-matcher.component';

@NgModule({
  imports: [CommonModule, RouterModule, MatTableModule, MatIconModule, MatTooltipModule],
  declarations: [UrlMatcherComponent],
  exports: [UrlMatcherComponent],
})
export class UrlMatcherComponentModule {}
