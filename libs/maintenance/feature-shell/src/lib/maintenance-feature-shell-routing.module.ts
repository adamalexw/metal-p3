import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApplyLyricsShellComponent } from './apply-lyrics/apply-lyrics.component';
import { LyricsHistoryShellComponent } from './lyrics-history/lyrics-history.component';
import { UnmappedFoldersShellComponent } from './unmapped-folders/unmapped-folders.component';

const routes: Routes = [
  {
    path: 'lyrics',
    component: LyricsHistoryShellComponent,
  },
  {
    path: 'lyrics/:id',
    component: ApplyLyricsShellComponent,
  },
  {
    path: 'folders',
    component: UnmappedFoldersShellComponent,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MaintenanceFeatureShellRoutingModule {}
