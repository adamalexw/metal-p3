import { PlaylistDto } from '@metal-p3/playlist/domain';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

export const PlaylistActions = createActionGroup({
  source: 'Playlist',
  events: {
    'Load Playlists': emptyProps(),
    'Load Playlists Success': props<{ playlists: PlaylistDto[] }>(),
    'Load Playlists Error': props<{ error: string }>(),
    Create: props<{ name: string }>(),
    'Create Success': props<{ playlist: PlaylistDto }>(),
    'Create Error': props<{ error: string }>(),
    Save: props<{ name: string }>(),
    'Save Success': props<{ playlist: PlaylistDto }>(),
    'Save Error': props<{ error: string }>(),
    'Load Playlist': props<{ id: number }>(),
    'Load Playlist Success': props<{ id: number }>(),
    Delete: emptyProps(),
    'Delete Success': props<{ id: number }>(),
    'Delete Error': props<{ error: string }>(),
  },
});
