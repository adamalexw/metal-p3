import { BandDto } from '@metal-p3/api-interfaces';
import { Update } from '@ngrx/entity';
import { createActionGroup, props } from '@ngrx/store';
import { Album } from '../model';

export const BandActions = createActionGroup({
  source: 'Band',
  events: {
    Save: props<{ band: BandDto }>(),
    'Save Success': props<{ update: Update<BandDto> }>(),
    'Get Props': props<{ id: number; url: string }>(),
    'Get Props Success': props<{ update: Update<Album> }>(),
  },
});
