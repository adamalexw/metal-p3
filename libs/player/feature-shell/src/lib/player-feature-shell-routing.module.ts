import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerShellComponent } from './player-shell/player-shell.component';

const routes: Routes = [
  {
    path: '',
    component: PlayerShellComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlayerFeatureShellRoutingModule {}
