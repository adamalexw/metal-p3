import { Album } from '@metal-p3/shared/data-access';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';

export const getCover = createAction('[Cover] Get', props<{ id: number; folder: string }>());
export const getCoverSuccess = createAction('[Cover] Get Success', props<{ update: Update<Album> }>());
export const downloadCover = createAction('[Cover] Download', props<{ id: number; url: string }>());
export const downloadCoverSuccess = createAction('[Cover] Download Success', props<{ update: Update<Album> }>());
export const clearCovers = createAction('[Cover] Clear All');
export const clearCoversSuccess = createAction('[Cover] Clear All Success');
export const saveCover = createAction('[Cover] Save', props<{ id: number; folder: string; cover: string }>());
export const saveCoverSuccess = createAction('[Cover] Save Success', props<{ update: Update<Album> }>());
