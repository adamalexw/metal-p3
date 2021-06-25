import { ApplyLyrics } from '@metal-p3/album/domain';
import { MetalArchivesAlbumTrack, Track } from '@metal-p3/api-interfaces';
import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { Album } from '../model';

export const getTracks = createAction('[Tracks] Get Tracks', props<{ id: number; folder: string }>());
export const getTracksSuccess = createAction('[Tracks] Get Tracks Success', props<{ id: number; tracks: Track[] }>());
export const saveTrack = createAction('[Tracks] Save Track', props<{ id: number; track: Track }>());
export const saveTrackSuccess = createAction('[Tracks] Save Track Success', props<{ id: number; track: Track }>());
export const renameTrack = createAction('[Tracks] Rename Track', props<{ id: number; track: Track }>());
export const renameTrackSuccess = createAction('[Tracks] Rename Track Success', props<{ id: number; trackId: number; file: string; fullPath: string }>());
export const transferTrack = createAction('[Tracks] Transfer Track', props<{ id: number; trackId: number }>());
export const transferTrackSuccess = createAction('[Tracks] Transfer Track Success', props<{ id: number; track: Track }>());
export const updateTracks = createAction('[Tracks] Update Tracks Success', props<{ id: number; updates: Update<Track>[] }>());

export const getMaTracks = createAction('[Tracks] Get MA Tracks', props<{ id: number; url: string }>());
export const getMaTracksSuccess = createAction('[Tracks] Get MA Tracks Success', props<{ id: number; maTracks: MetalArchivesAlbumTrack[] }>());
export const getLyrics = createAction('[Tracks] Get Lyrics', props<{ id: number; trackId: number }>());
export const getLyricsSuccess = createAction('[Tracks] Get Lyrics Success', props<{ id: number; trackId: number; lyrics: string }>());
export const applyLyrics = createAction('[Tracks] Apply Lyrics', props<{ id: number; lyrics: ApplyLyrics[] }>());
export const applyLyricsSuccess = createAction('[Tracks] Apply Lyrics Success', props<{ update: Update<Album> }>());

export const deleteTrack = createAction('[Tracks] Delete Track', props<{ id: number; track: Track }>());
export const deleteTrackSuccess = createAction('[Tracks] Delete Track Success', props<{ id: number; track: Track }>());
export const deleteTrackError = createAction('[Tracks] Delete Track Error', props<{ id: number; trackId: number; error: string }>());
