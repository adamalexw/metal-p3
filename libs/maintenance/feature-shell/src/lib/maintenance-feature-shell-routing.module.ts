import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApplyLyricsShellComponent } from './apply-lyrics/apply-lyrics.component';
import { LyricsHistoryShellComponent } from './lyrics-history/lyrics-history.component';

const routes: Routes = [
  {
    path: 'lyrics',
    component: LyricsHistoryShellComponent,
  },
  {
    path: 'lyrics/:id',
    component: ApplyLyricsShellComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MaintenanceFeatureShellRoutingModule {}
