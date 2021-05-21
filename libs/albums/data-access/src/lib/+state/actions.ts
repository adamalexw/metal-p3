import { ApplyLyrics, SearchRequest } from '@metal-p3/albums/domain';
import { BandDto, MetalArchivesAlbumTrack, Track } from '@metal-p3/api-interfaces';
import { EntityMap, EntityMapOne, Predicate, Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { Album } from '../album';

export const loadAlbums = createAction('[Albums] Load Albums', props<{ request: Partial<SearchRequest> }>());
export const loadAlbumsSuccess = createAction('[Albums] Load Albums Success', props<{ albums: Album[] }>());
export const addAlbum = createAction('[Albums] Add Album', props<{ album: Album }>());
export const setAlbum = createAction('[Albums] Set Album', props<{ album: Album }>());
export const upsertAlbum = createAction('[Albums] Upsert Album', props<{ album: Album }>());
export const addAlbums = createAction('[Albums] Add Albums', props<{ albums: Album[] }>());
export const upsertAlbums = createAction('[Albums] Upsert Albums', props<{ albums: Album[] }>());
export const updateAlbum = createAction('[Albums] Update Album', props<{ update: Update<Album> }>());
export const updateAlbums = createAction('[Albums] Update Albums', props<{ updates: Update<Album>[] }>());
export const mapAlbum = createAction('[Albums] Map Album', props<{ entityMap: EntityMapOne<Album> }>());
export const mapAlbums = createAction('[Albums] Map Albums', props<{ entityMap: EntityMap<Album> }>());
export const deleteAlbum = createAction('[Albums] Delete Album', props<{ id: string }>());
export const deleteAlbums = createAction('[Albums] Delete Albums', props<{ ids: string[] }>());
export const deleteAlbumsByPredicate = createAction('[Albums] Delete Albums By Predicate', props<{ predicate: Predicate<Album> }>());
export const clearAlbums = createAction('[Albums] Clear Albums');

export const getCover = createAction('[Albums] Get Cover', props<{ id: number; folder: string }>());
export const getCoverSuccess = createAction('[Albums] Get Cover Success', props<{ update: Update<Album> }>());
export const downloadCover = createAction('[Albums] Download Cover', props<{ id: number; url: string }>());
export const clearCovers = createAction('[Albums] Clear Covers');
export const clearCoversSuccess = createAction('[Albums] Clear Covers Success');

export const addNewAlbum = createAction('[Albums] Add New Album', props<{ folder: string }>());
export const getAlbum = createAction('[Albums] Get Album', props<{ id: number }>());

export const getTracks = createAction('[Albums] Get Tracks', props<{ id: number; folder: string }>());
export const getTracksSuccess = createAction('[Albums] Get Tracks Success', props<{ id: number; tracks: Track[] }>());
export const saveTrack = createAction('[Albums] Save Track', props<{ id: number; track: Track }>());
export const saveTrackSuccess = createAction('[Albums] Save Track Success', props<{ id: number; track: Track }>());
export const renameTrack = createAction('[Albums] Rename Track', props<{ id: number; track: Track }>());
export const renameTrackSuccess = createAction('[Albums] Rename Track Success', props<{ id: number; track: Track }>());
export const getMaTracks = createAction('[Albums] Get MA Tracks', props<{ id: number; url: string }>());
export const getMaTracksSuccess = createAction('[Albums] Get MA Tracks Success', props<{ id: number; maTracks: MetalArchivesAlbumTrack[] }>());

export const getLyrics = createAction('[Albums] Get Lyrics', props<{ id: number; trackId: number }>());
export const getLyricsSuccess = createAction('[Albums] Get Lyrics Success', props<{ id: number; trackId: number; lyrics: string }>());
export const applyLyrics = createAction('[Albums] Apply Lyrics', props<{ id: number; lyrics: ApplyLyrics[] }>());
export const applyLyricsSuccess = createAction('[Albums] Apply Lyrics Success', props<{ update: Update<Album> }>());

export const saveAlbum = createAction('[Albums] Save Album', props<{ album: Album }>());
export const saveAlbumSuccess = createAction('[Albums] Save Album Success', props<{ update: Update<Album> }>());

export const saveBand = createAction('[Albums] Save Band', props<{ band: BandDto }>());
export const saveBandSuccess = createAction('[Albums] Save Band Success', props<{ update: Update<BandDto> }>());
export const getBandProps = createAction('[Albums] Get Band Props', props<{ id: number; url: string }>());
export const getBandPropsSuccess = createAction('[Albums] Get Band Props Success', props<{ update: Update<Album> }>());

export const findMaUrl = createAction('[Albums] Find Metal Archives Url', props<{ id: number; artist: string; album: string }>());
export const findMaUrlSuccess = createAction('[Albums] Find Metal Archives Success', props<{ update: Update<Album> }>());
