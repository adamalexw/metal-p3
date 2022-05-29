import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AdvancedSearchFormComponent } from './advanced-search-form.component';

@NgModule({
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MatListModule, MatFormFieldModule, MatCheckboxModule, MatIconModule, MatInputModule, MatButtonModule],
  declarations: [AdvancedSearchFormComponent],
  exports: [AdvancedSearchFormComponent],
})
export class AdvancedSearchFormComponentModule {}
