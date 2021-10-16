import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MaintenanceDataAccessModule } from '@metal-p3/maintenance/data-access';

const routes: Routes = [
  {
    path: 'lyrics',
    loadChildren: () => import('../lib/lyrics-history/lyrics-history.component.module').then((m) => m.LyricsHistoryShellComponentModule),
  },
  {
    path: 'lyrics/:id',
    loadChildren: () => import('../lib/apply-lyrics/apply-lyrics.component.module').then((m) => m.ApplyLyricsShellComponentModule),
  },
  {
    path: 'folders',
    loadChildren: () => import('../lib/unmapped-folders/unmapped-folders.component.module').then((m) => m.UnmappedFoldersShellComponentModule),
  },
  {
    path: 'extraFiles',
    loadChildren: () => import('../lib/extra-files/extra-files.component.module').then((m) => m.ExtraFilesShellComponentModule),
  },
  {
    path: 'matcher',
    loadChildren: () => import('../lib/url-matcher/url-matcher.component.module').then((m) => m.UrlMatcherShellComponentModule),
  },
];
@NgModule({
  imports: [MaintenanceDataAccessModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MaintenanceFeatureShellModule {}
