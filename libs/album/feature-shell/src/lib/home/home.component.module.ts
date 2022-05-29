import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AdvancedSearchShellComponentModule } from '../advanced-search/advanced-search.component.module';
import { ListComponentModule } from '../list/list.component.module';
import { HomeComponent } from './home.component';

@NgModule({
  imports: [CommonModule, RouterModule, MatSidenavModule, ListComponentModule, AdvancedSearchShellComponentModule],
  declarations: [HomeComponent],
  exports: [HomeComponent],
})
export class HomeComponentModule {}
