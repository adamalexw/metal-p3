import { Routes } from '@angular/router';

export const MAINTENANCE_ROUTES: Routes = [
  {
    path: 'lyrics',
    loadComponent: () => import('../lib/lyrics-history/lyrics-history.component').then((m) => m.LyricsHistoryShellComponent),
  },
  {
    path: 'lyrics/:id',
    loadComponent: () => import('../lib/apply-lyrics/apply-lyrics.component').then((m) => m.ApplyLyricsShellComponent),
  },
  {
    path: 'folders',
    loadComponent: () => import('../lib/unmapped-folders/unmapped-folders.component').then((m) => m.UnmappedFoldersShellComponent),
  },
  {
    path: 'extraFiles',
    loadComponent: () => import('../lib/extra-files/extra-files.component').then((m) => m.ExtraFilesShellComponent),
  },
  {
    path: 'matcher',
    loadComponent: () => import('../lib/url-matcher/url-matcher.component').then((m) => m.UrlMatcherShellComponent),
  },
];
