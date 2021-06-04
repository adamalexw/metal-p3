import { PlaylistItem } from '@metal-p3/player/domain';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';

export const addTrackToPlaylist = createAction('[Player] Add Track', props<{ track: PlaylistItem }>());
export const addTracksToPlaylist = createAction('[Player] Add Tracks', props<{ tracks: PlaylistItem[] }>());

export const updatePlaylist = createAction('[Player] Update Items', props<{ updates: Update<PlaylistItem>[] }>());
export const playTrack = createAction('[Player] Play Track', props<{ id: string }>());
export const playTrackSuccess = createAction('[Player] Play Track', props<{ id: string }>());
