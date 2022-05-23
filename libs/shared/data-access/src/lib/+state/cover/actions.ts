import { FolderRequest } from '@metal-p3/album/domain';
import { Update } from '@ngrx/entity';
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Album } from '../model';

export const CoverActions = createActionGroup({
  source: 'Cover',
  events: {
    Get: props<{ id: number; folder: string }>(),
    'Get Success': props<{ update: Update<Album> }>(),
    'Get Error': props<{ update: Update<Album> }>(),
    'Get Many': props<{ request: FolderRequest[] }>(),
    'Get Many Success': props<{ update: Update<Album>[] }>(),
    'Get Many Error': props<{ update: Update<Album>[] }>(),
    Download: props<{ id: number; url: string }>(),
    'Download Success': props<{ update: Update<Album> }>(),
    'Clear All': emptyProps(),
    'Clear All Success': emptyProps(),
    Save: props<{ id: number; folder: string; cover: string }>(),
    'Save Success': props<{ update: Update<Album> }>(),
  },
});
