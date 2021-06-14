import { SearchRequest } from '@metal-p3/album/domain';
import { EntityMap, EntityMapOne, Predicate, Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { Album } from '../model';

export const loadAlbums = createAction('[Album] Load Albums', props<{ request: Partial<SearchRequest> }>());
export const loadAlbumsSuccess = createAction('[Album] Load Albums Success', props<{ albums: Album[] }>());
export const loadAlbumsError = createAction('[Album] Load Albums Error', props<{ loadError: string }>());

export const addAlbum = createAction('[Album] Add Album', props<{ album: Album }>());
export const setAlbum = createAction('[Album] Set Album', props<{ album: Album }>());
export const upsertAlbum = createAction('[Album] Upsert Album', props<{ album: Album }>());
export const addAlbums = createAction('[Album] Add Albums', props<{ albums: Album[] }>());
export const upsertAlbums = createAction('[Album] Upsert Albums', props<{ albums: Album[] }>());
export const updateAlbum = createAction('[Album] Update Album', props<{ update: Update<Album> }>());
export const updateAlbums = createAction('[Album] Update Albums', props<{ updates: Update<Album>[] }>());
export const mapAlbum = createAction('[Album] Map Album', props<{ entityMap: EntityMapOne<Album> }>());
export const mapAlbums = createAction('[Album] Map Albums', props<{ entityMap: EntityMap<Album> }>());
export const deleteAlbum = createAction('[Album] Delete Album', props<{ id: string }>());
export const deleteAlbums = createAction('[Album] Delete Albums', props<{ ids: string[] }>());
export const deleteAlbumsByPredicate = createAction('[Album] Delete Albums By Predicate', props<{ predicate: Predicate<Album> }>());
export const clearAlbums = createAction('[Album] Clear Albums');

export const viewAlbum = createAction('[Album] View Album', props<{ id: number }>());

export const addNewAlbum = createAction('[Album] Add New Album', props<{ folder: string }>());
export const getAlbum = createAction('[Album] Get Album', props<{ id: number }>());
export const renameFolder = createAction('[Album] Rename Folder', props<{ id: number; src: string; artist: string; album: string }>());
export const renameFolderSuccess = createAction('[Album] Rename Folder Success', props<{ update: Update<Album> }>());
export const renameFolderError = createAction('[Album] Rename Folder Error', props<{ update: Update<Album> }>());

export const saveAlbum = createAction('[Album] Save Album', props<{ album: Album }>());
export const saveAlbumSuccess = createAction('[Album] Save Album Success', props<{ update: Update<Album> }>());
export const saveAlbumError = createAction('[Album] Save Album Error', props<{ update: Update<Album> }>());

export const setHasLyrics = createAction('[Album] Set Has Lyrics', props<{ id: number; hasLyrics: boolean }>());
export const setTransferred = createAction('[Album] Set Transferred', props<{ id: number; transferred: boolean }>());

export const findMaUrl = createAction('[Album] Find Metal Archives Url', props<{ id: number; artist: string; album: string }>());
export const findMaUrlSuccess = createAction('[Album] Find Metal Archives Success', props<{ update: Update<Album> }>());

export const createNew = createAction('[Album] Create New');
export const createNewSuccess = createAction('[Album] Create New Success');
