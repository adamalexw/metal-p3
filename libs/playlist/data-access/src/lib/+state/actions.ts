import { PlaylistDto } from '@metal-p3/playlist/domain';
import { createAction, props } from '@ngrx/store';

export const loadPlaylists = createAction('[Playlist] Load Playlists');
export const loadPlaylistsSuccess = createAction('[Playlist] Load Playlists Success', props<{ playlists: PlaylistDto[] }>());
export const loadPlaylistsError = createAction('[Playlist] Load Playlists Error', props<{ error: string }>());

export const createPlaylist = createAction('[Playlist] Create', props<{ name: string }>());
export const createPlaylistSuccess = createAction('[Playlist] Create Success', props<{ playlist: PlaylistDto }>());
export const createPlaylistError = createAction('[Playlist] Create Error', props<{ error: string }>());

export const savePlaylist = createAction('[Playlist] Save', props<{ name: string }>());
export const savePlaylistSuccess = createAction('[Playlist] Save Success', props<{ playlist: PlaylistDto }>());
export const savePlaylistError = createAction('[Playlist] Save Error', props<{ error: string }>());

export const loadPlaylist = createAction('[Playlist] Load Playlist', props<{ id: number }>());
export const loadPlaylistSuccess = createAction('[Playlist] Load Playlist Success', props<{ id: number }>());

export const deletePlaylist = createAction('[Playlist] Delete');
export const deletePlaylistSuccess = createAction('[Playlist] Delete Success', props<{ id: number }>());
export const deletePlaylistError = createAction('[Playlist] Delete Error', props<{ error: string }>());
