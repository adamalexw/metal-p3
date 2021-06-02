import { BandDto } from '@metal-p3/api-interfaces';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { Album } from '../model';

export const saveBand = createAction('[Band] Save', props<{ band: BandDto }>());
export const saveBandSuccess = createAction('[Band] Save Success', props<{ update: Update<BandDto> }>());
export const getBandProps = createAction('[Band] Get Props', props<{ id: number; url: string }>());
export const getBandPropsSuccess = createAction('[Band] Get Props Success', props<{ update: Update<Album> }>());
