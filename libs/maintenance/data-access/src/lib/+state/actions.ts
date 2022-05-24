import { LyricsHistoryDto, UrlMatcher } from '@metal-p3/maintenance/domain';
import { Update } from '@ngrx/entity';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const MaintenanceActions = createActionGroup({
  source: 'Maintenance',
  events: {
    'Add Lyrics Priority': props<{ albumId: number }>(),
    'Get Lyrics History': props<{ priority: boolean }>(),
    'Get Lyrics History Success': props<{ history: LyricsHistoryDto[] }>(),
    'Get Lyrics History Error': props<{ error: string }>(),
    'Check Lyrics History': props<{ priority: boolean }>(),
    'Check Lyrics History Success': emptyProps(),
    'Check Lyrics History Error': props<{ error: string }>(),
    'Update Lyrics History': props<{ update: Update<LyricsHistoryDto> }>(),
    'Delete Lyrics History': props<{ id: number }>(),
    'Delete Lyrics History Success': props<{ id: number }>(),
    'Delete Lyrics History Error': props<{ id: number; error: string }>(),
    'Checked Lyrics History': props<{ id: number; checked: boolean }>(),
    'Checked Lyrics History Success': props<{ update: Update<LyricsHistoryDto> }>(),
    'Checked Lyrics History Error': props<{ id: number; error: string }>(),
    'Stop Lyrics History Check': emptyProps(),
    'Get Url Matcher': emptyProps(),
    'Get Url Matcher Success': props<{ albums: UrlMatcher[] }>(),
    'Get Url Matcher Error': props<{ error: string }>(),
    'Start Url Matcher': emptyProps(),
    'Update Url Matcher': props<{ update: Update<UrlMatcher> }>(),
    'Stop Url Matcher': emptyProps(),
  },
});
