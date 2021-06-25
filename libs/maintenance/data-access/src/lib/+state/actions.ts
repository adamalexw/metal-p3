import { PlaylistItem } from '@metal-p3/player/domain';
import { createAction, props } from '@ngrx/store';

export const addLyricsPriority = createAction('[Maintenance] Add Lyrics Priority', props<{ albumId: number }>());
export const addLyricsPrioritySuccess = createAction('[Maintenance] Add Lyrics Priority Success', props<{ tracks: PlaylistItem[] }>());
