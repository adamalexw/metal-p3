import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';

@NgModule({
  imports: [CommonModule, RouterModule, StoreModule.forRoot({ router: routerReducer }), EffectsModule.forRoot([]), StoreRouterConnectingModule.forRoot()],
})
export class SharedNgrxStoreModule {}
