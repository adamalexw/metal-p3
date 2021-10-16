import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { NavToolbarComponent } from './nav-toolbar.component';

const materialModules = [MatToolbarModule, MatIconModule];

@NgModule({
  imports: [CommonModule, RouterModule, materialModules],
  declarations: [NavToolbarComponent],
  exports: [NavToolbarComponent],
})
export class SharedNavToolbarModule {}
