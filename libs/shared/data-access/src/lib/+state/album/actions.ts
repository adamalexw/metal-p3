import { SearchRequest } from '@metal-p3/album/domain';
import { EntityMap, EntityMapOne, Predicate, Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { Album } from '../model';

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

export const viewAlbum = createAction('[Albums] View Album', props<{ id: number }>());

export const addNewAlbum = createAction('[Albums] Add New Album', props<{ folder: string }>());
export const getAlbum = createAction('[Albums] Get Album', props<{ id: number }>());
export const renameFolder = createAction('[Albums] Rename Folder', props<{ id: number; src: string; artist: string; album: string }>());
export const renameFolderSuccess = createAction('[Albums] Rename Folder Success', props<{ update: Update<Album> }>());

export const saveAlbum = createAction('[Albums] Save Album', props<{ album: Album }>());
export const saveAlbumSuccess = createAction('[Albums] Save Album Success', props<{ update: Update<Album> }>());

export const findMaUrl = createAction('[Albums] Find Metal Archives Url', props<{ id: number; artist: string; album: string }>());
export const findMaUrlSuccess = createAction('[Albums] Find Metal Archives Success', props<{ update: Update<Album> }>());

export const createNew = createAction('[Albums] Create New');
export const createNewSuccess = createAction('[Albums] Create New Success');
