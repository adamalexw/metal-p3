import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CoverComponentModule } from '@metal-p3/cover/ui';
import { ListItemComponent } from './list-item.component';

@NgModule({
  imports: [CommonModule, CoverComponentModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  declarations: [ListItemComponent],
  exports: [ListItemComponent],
})
export class ListItemComponentModule {}
