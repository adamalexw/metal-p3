import { PlaylistItem } from '@metal-p3/player/domain';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';

export const showPlayer = createAction('[Player] Show');
export const closePlayer = createAction('[Player] Close');
export const tooglePlayerView = createAction('[Player] Toogle View');

export const addTrackToPlaylist = createAction('[Player] Add Items', props<{ track: PlaylistItem }>());
export const addTracksToPlaylist = createAction('[Player] Add Item', props<{ tracks: PlaylistItem[] }>());

export const updatePlaylist = createAction('[Player] Update Items', props<{ updates: Update<PlaylistItem>[] }>());
export const updatePlaylistItem = createAction('[Player] Update Item', props<{ update: Update<PlaylistItem> }>());
export const reorderPlaylist = createAction('[Player] Reorder', props<{ updates: Update<PlaylistItem>[] }>());

export const playItem = createAction('[Player] Play Item', props<{ id: string }>());
export const pauseItem = createAction('[Player] Pause Item');

export const removeItem = createAction('[Player] Remove Item', props<{ id: string }>());
export const removeItemSuccess = createAction('[Player] Remove Item Success', props<{ id: string }>());

export const playPrevious = createAction('[Player] Play Previous');
export const playNext = createAction('[Player] Pause Next');

export const clearPlaylist = createAction('[Player] Clear');
export const noopPlaylist = createAction('[Player] Noop');

export const getItemCover = createAction('[Player] Get Cover', props<{ id: string; folder: string }>());
export const getItemCoverSuccess = createAction('[Player] Get Cover Success', props<{ update: Update<PlaylistItem> }>());
export const getItemCoverError = createAction('[Player] Get Cover Error', props<{ update: Update<PlaylistItem> }>());

export const clearBlobs = createAction('[Player] Clear Blobs');
