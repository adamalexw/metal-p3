import { LyricsHistoryDto } from '@metal-p3/maintenance/domain';
import { PlaylistItem } from '@metal-p3/player/domain';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';

export const addLyricsPriority = createAction('[Maintenance] Add Lyrics Priority', props<{ albumId: number }>());
export const addLyricsPrioritySuccess = createAction('[Maintenance] Add Lyrics Priority Success', props<{ tracks: PlaylistItem[] }>());

export const getLyricsHistory = createAction('[Maintenance] Get Lyrics History', props<{ priority: boolean }>());
export const getLyricsHistorySuccess = createAction('[Maintenance] Get Lyrics History Success', props<{ history: LyricsHistoryDto[] }>());
export const getLyricsHistoryError = createAction('[Maintenance] Get Lyrics History Error', props<{ error: string }>());

export const checkLyricsHistory = createAction('[Maintenance] Check Lyrics History', props<{ priority: boolean }>());
export const checkLyricsHistorySuccess = createAction('[Maintenance] Check Lyrics History Success');
export const checkLyricsHistoryError = createAction('[Maintenance] Check Lyrics History Error', props<{ error: string }>());

export const updateLyricsHistory = createAction('[Maintenance] Update Lyrics History', props<{ update: Update<LyricsHistoryDto> }>());

export const deleteLyricsHistory = createAction('[Maintenance] Delete Lyrics History', props<{ id: number }>());
export const deleteLyricsHistorySuccess = createAction('[Maintenance] Delete Lyrics History Success', props<{ id: number }>());
export const deleteLyricsHistoryError = createAction('[Maintenance] Delete Lyrics History Error', props<{ id: number; error: string }>());

export const checkedLyricsHistory = createAction('[Maintenance] Checked Lyrics History', props<{ id: number; checked: boolean }>());
export const checkedLyricsHistorySuccess = createAction('[Maintenance] Checked Lyrics History Success', props<{ update: Update<LyricsHistoryDto> }>());
export const checkedLyricsHistoryError = createAction('[Maintenance] Checked Lyrics History Error', props<{ id: number; error: string }>());

export const stopLyricsCheck = createAction('[Maintenance] Stop Lyrics History Check');
