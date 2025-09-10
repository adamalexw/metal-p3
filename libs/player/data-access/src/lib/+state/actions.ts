import { PlaylistItem } from '@metal-p3/player/domain';
import { Update } from '@ngrx/entity';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const PlayerActions = createActionGroup({
  source: 'Player',
  events: {
    Show: emptyProps(),
    Close: emptyProps(),
    'Toogle View': emptyProps(),
    'Add Item': props<{ track: PlaylistItem }>(),
    'Add Items': props<{ tracks: PlaylistItem[] }>(),
    'Update Items': props<{ updates: Update<PlaylistItem>[] }>(),
    'Update Item': props<{ update: Update<PlaylistItem> }>(),
    Reorder: props<{ updates: Update<PlaylistItem>[] }>(),
    Play: props<{ id: string }>(),
    'Play Error': props<{ update: Update<PlaylistItem> }>(),
    Pause: emptyProps(),
    Remove: props<{ id: string }>(),
    'Remove Success': props<{ id: string }>(),
    'Play Previous': emptyProps(),
    'Play Next': emptyProps(),
    Clear: emptyProps(),
    'Clear Success': emptyProps(),
    Noop: emptyProps(),
    Shuffle: emptyProps(),
    'Shuffle Success': props<{ updates: Update<PlaylistItem>[] }>(),
    'Get Cover': props<{ id: string; folder: string }>(),
    'Get Cover Success': props<{ update: Update<PlaylistItem> }>(),
    'Get Cover Error': props<{ update: Update<PlaylistItem> }>(),
    'Toogle Playlist': emptyProps(),
  },
});
